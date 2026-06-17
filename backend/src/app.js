const FLAG_BASE_PATH = '/assets/img/flags/';
function flagAsset(code) { return `${FLAG_BASE_PATH}${String(code || '').toUpperCase()}.png`; }

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { query } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const frontendDir = path.resolve(rootDir, 'frontend');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const PREDICTION_CLOSE_MINUTES = Number(process.env.PREDICTION_CLOSE_MINUTES || 10);
const DEFAULT_PRIZE = process.env.DEFAULT_PRIZE || 'Banho grátis PetFunny';
const PUBLIC_BASE_URL = String(process.env.PUBLIC_BASE_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || '';
const MP_AUTO_RETURN = String(process.env.MERCADO_PAGO_AUTO_RETURN || 'auto').toLowerCase();
const PAYMENT_DEMO_AUTOPAY = String(process.env.PAYMENT_DEMO_AUTOPAY || '').toLowerCase() === 'true';
const RESET_TOKEN_EXPIRES_MINUTES = Number(process.env.RESET_TOKEN_EXPIRES_MINUTES || 60);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/assets', express.static(path.join(frontendDir, 'assets'), { maxAge: '1h' }));

function cleanText(value) {
  return String(value ?? '').trim();
}

function onlyDigits(value) {
  return String(value ?? '').replace(/\D+/g, '');
}

function parseBool(value, fallback = true) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return ['1', 'true', 'sim', 'yes', 'on'].includes(String(value).toLowerCase());
}

function normalizeEmail(value) {
  return cleanText(value).toLowerCase();
}


function base64UrlToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function hashToken(value = '') {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function isProduction() {
  return String(process.env.NODE_ENV || '').toLowerCase() === 'production';
}

function buildPublicUrl(pathname = '/', params = {}) {
  const rawBase = cleanText(PUBLIC_BASE_URL) || 'http://localhost:3000';
  let url;
  try {
    url = new URL(pathname, rawBase.endsWith('/') ? rawBase : `${rawBase}/`);
  } catch (_error) {
    url = new URL(pathname, 'http://localhost:3000');
  }
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });
  return url.toString();
}

function isLocalCallbackUrl(urlValue = '') {
  try {
    const url = new URL(urlValue);
    return ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(url.hostname);
  } catch (_error) {
    return true;
  }
}

function isValidPublicHttpsUrl(urlValue = '') {
  try {
    const url = new URL(urlValue);
    return url.protocol === 'https:' && !isLocalCallbackUrl(urlValue);
  } catch (_error) {
    return false;
  }
}

function shouldEnableMercadoPagoAutoReturn(successUrl = '') {
  if (['false', '0', 'no', 'off', 'disabled'].includes(MP_AUTO_RETURN)) return false;
  if (['true', '1', 'yes', 'on', 'approved'].includes(MP_AUTO_RETURN)) return isValidPublicHttpsUrl(successUrl);
  return isValidPublicHttpsUrl(successUrl);
}

function mercadoPagoNotificationUrl() {
  const explicitUrl = cleanText(process.env.MERCADO_PAGO_NOTIFICATION_URL || process.env.MP_NOTIFICATION_URL);
  const candidateUrl = explicitUrl || buildPublicUrl('/api/payments/mercado-pago/webhook');

  if (!isValidPublicHttpsUrl(candidateUrl)) {
    console.warn('[mercado-pago] notification_url omitida: configure PUBLIC_BASE_URL ou MERCADO_PAGO_NOTIFICATION_URL com uma URL HTTPS pública. Valor atual:', candidateUrl);
    return null;
  }

  return candidateUrl;
}

function mercadoPagoBackUrls(gameId) {
  return {
    success: buildPublicUrl('/app', { payment: 'success', gameId }),
    pending: buildPublicUrl('/app', { payment: 'pending', gameId }),
    failure: buildPublicUrl('/app', { payment: 'failure', gameId })
  };
}


async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const host = cleanText(process.env.SMTP_HOST);
  const port = Number(process.env.SMTP_PORT || 587);
  const user = cleanText(process.env.SMTP_USER);
  const pass = cleanText(process.env.SMTP_PASS);
  const from = cleanText(process.env.SMTP_FROM || process.env.SMTP_USER || 'Bolão da Copa PetFunny <no-reply@petfunny.com.br>');

  if (!host || !user || !pass) {
    console.warn('[email] SMTP não configurado. Link de redefinição gerado:', resetUrl);
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  await transporter.sendMail({
    from,
    to,
    subject: 'Redefinir senha — Bolão da Copa PetFunny',
    text: `Olá ${name || 'participante'},\n\nRecebemos uma solicitação para redefinir sua senha do Bolão da Copa PetFunny.\n\nAcesse o link abaixo para cadastrar uma nova senha:\n${resetUrl}\n\nO link expira em ${RESET_TOKEN_EXPIRES_MINUTES} minutos.\n\nSe você não solicitou, ignore este e-mail.`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#17212b"><h2>Bolão da Copa PetFunny</h2><p>Olá ${name || 'participante'},</p><p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${resetUrl}" style="display:inline-block;background:#01adb7;color:#fff;padding:12px 16px;border-radius:12px;text-decoration:none;font-weight:700">Cadastrar nova senha</a></p><p>O link expira em ${RESET_TOKEN_EXPIRES_MINUTES} minutos.</p><p>Se você não solicitou, ignore este e-mail.</p></div>`
  });

  return { sent: true };
}

function gameTeam1(row = {}) {
  return cleanText(row.team1_name) || (cleanText(row.title) && cleanText(row.title) !== 'Brasil na Copa' && !cleanText(row.title).includes(' x ') ? cleanText(row.title) : 'Brasil');
}

function gameTeam2(row = {}) {
  return cleanText(row.team2_name) || cleanText(row.opponent) || 'Adversário';
}

function gameLabel(row = {}) {
  return `${gameTeam1(row)} x ${gameTeam2(row)}`;
}

function normalizeScore(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 99) return null;
  return number;
}

function normalizeDateInput(value) {
  const raw = cleanText(value);
  if (!raw) return '';
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return raw;
}

function normalizeTimeInput(value) {
  const raw = cleanText(value) || '16:00';
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return '16:00';
  const hour = Math.max(0, Math.min(23, Number(match[1])));
  const minute = Math.max(0, Math.min(59, Number(match[2])));
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function parseAmountCents(value, fallback = 1000) {
  if (value === undefined || value === null || value === '') return fallback;
  if (Number.isInteger(value)) return Math.max(0, value);
  const raw = cleanText(value).replace(/R\$/gi, '').replace(/\s+/g, '').replace(/\./g, '').replace(',', '.');
  const number = Number(raw);
  if (!Number.isFinite(number) || number < 0) return fallback;
  return Math.round(number * 100);
}

function centsToAmount(cents) {
  return Number((Number(cents || 0) / 100).toFixed(2));
}

function toIsoDate(value) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function toTime(value) {
  if (!value) return '16:00';
  return String(value).slice(0, 5) || '16:00';
}

function subtractMinutesFromDateTime(dateValue, timeValue, minutes = 10) {
  const date = toIsoDate(dateValue);
  const time = toTime(timeValue);
  if (!date || !time) return null;
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  value.setUTCMinutes(value.getUTCMinutes() - Number(minutes || 0));
  const pad = (number) => String(number).padStart(2, '0');
  return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}T${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}`;
}

function signAdminToken() {
  return jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function signTutorToken(tutor) {
  return jwt.sign({ role: 'tutor', tutorId: tutor.id, whatsapp: tutor.whatsapp, email: tutor.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function bearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function requireAdmin(req, res, next) {
  try {
    const token = bearerToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Acesso admin obrigatório.' });
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Sessão admin expirada. Faça login novamente.' });
  }
}

async function requireTutor(req, res, next) {
  try {
    const token = bearerToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'tutor' || !decoded.tutorId) return res.status(403).json({ error: 'Acesso do participante obrigatório.' });
    const result = await query('SELECT * FROM tutors WHERE id=$1::uuid AND deleted_at IS NULL', [decoded.tutorId]);
    if (!result.rowCount) return res.status(401).json({ error: 'Participante não encontrado.' });
    req.tutor = result.rows[0];
    next();
  } catch {
    res.status(401).json({ error: 'Sessão expirada. Entre novamente no Bolão PetFunny.' });
  }
}

function sanitizeTutor(row = {}) {
  const pixKey = row.pix_key || '';
  return {
    id: row.id,
    name: row.name || 'Participante PetFunny',
    fullName: row.name || 'Participante PetFunny',
    whatsapp: row.whatsapp || '',
    email: row.email || '',
    pixKeyType: row.pix_key_type || '',
    pixKey,
    hasPixKey: Boolean(pixKey),
    createdAt: row.created_at
  };
}

function sanitizePayment(row = {}) {
  if (!row?.id && !row?.payment_id) return null;
  return {
    id: row.id || row.payment_id,
    gameId: row.game_id || row.payment_game_id || '',
    tutorId: row.tutor_id || '',
    amountCents: Number(row.amount_cents || row.payment_amount_cents || 0),
    amount: centsToAmount(row.amount_cents || row.payment_amount_cents || 0),
    currency: row.currency || row.payment_currency || 'BRL',
    status: row.payment_status || row.status || 'pending',
    method: row.payment_method || row.method || 'checkout',
    provider: row.payment_provider || row.provider || 'mercado_pago',
    preferenceId: row.preference_id || '',
    mercadoPagoPaymentId: row.mercado_pago_payment_id || '',
    checkoutUrl: row.checkout_url || '',
    pixQrCode: row.pix_qr_code || '',
    pixQrCodeBase64: row.pix_qr_code_base64 || '',
    expiresAt: row.expires_at || null,
    createdAt: row.payment_created_at || row.created_at || null,
    updatedAt: row.payment_updated_at || row.updated_at || null
  };
}

function sanitizeGame(row = {}) {
  const matchDate = toIsoDate(row.match_date);
  const matchTime = toTime(row.match_time);
  const predictionClosesAt = subtractMinutesFromDateTime(matchDate, matchTime, PREDICTION_CLOSE_MINUTES);
  const team1 = gameTeamData(row, 'team1');
  const team2 = gameTeamData(row, 'team2');
  const team1Name = team1.name;
  const team2Name = team2.name;
  return {
    id: row.id,
    title: row.title || `${team1Name} x ${team2Name}`,
    team1Name,
    team1Code: team1.code,
    team1Flag: team1.flag,
    team2Name,
    team2Code: team2.code,
    team2Flag: team2.flag,
    opponent: team2Name,
    roundName: row.round_name || '',
    groupName: groupForGame(row),
    matchDate,
    matchTime,
    status: row.status || 'scheduled',
    team1Score: row.brazil_score === null || row.brazil_score === undefined ? null : Number(row.brazil_score),
    team2Score: row.opponent_score === null || row.opponent_score === undefined ? null : Number(row.opponent_score),
    brazilScore: row.brazil_score === null || row.brazil_score === undefined ? null : Number(row.brazil_score),
    opponentScore: row.opponent_score === null || row.opponent_score === undefined ? null : Number(row.opponent_score),
    prizeDescription: row.prize_description || DEFAULT_PRIZE,
    entryFeeCents: Number(row.entry_fee_cents || 0),
    entryFee: centsToAmount(row.entry_fee_cents || 0),
    currency: row.currency || 'BRL',
    accumulatedCents: Number(row.accumulated_cents || 0),
    accumulated: centsToAmount(row.accumulated_cents || 0),
    participantsCount: Number(row.participants_count || 0),
    isActive: row.is_active !== false,
    isOpen: Boolean(row.is_open),
    predictionClosesAt,
    predictionsCount: Number(row.predictions_count || 0),
    correctCount: Number(row.correct_count || 0),
    wrongCount: Number(row.wrong_count || 0),
    awardedCount: Number(row.awarded_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function sanitizePrediction(row = {}) {
  const team1 = gameTeamData(row, 'team1');
  const team2 = gameTeamData(row, 'team2');
  const team1Name = team1.name;
  const team2Name = team2.name;
  const team1Score = Number(row.predicted_brazil_score || 0);
  const team2Score = Number(row.predicted_opponent_score || 0);
  return {
    id: row.id,
    gameId: row.game_id,
    tutorId: row.tutor_id,
    tutorName: row.tutor_name || row.name || '',
    tutorWhatsapp: row.tutor_whatsapp || row.whatsapp || '',
    tutorEmail: row.tutor_email || row.email || '',
    gameTitle: row.game_title || row.title || gameLabel(row),
    groupName: groupForGame(row),
    team1Name,
    team1Code: team1.code,
    team1Flag: team1.flag,
    team2Name,
    team2Code: team2.code,
    team2Flag: team2.flag,
    opponent: team2Name,
    matchDate: toIsoDate(row.match_date),
    matchTime: toTime(row.match_time),
    prizeDescription: row.prize_description || row.award_description || DEFAULT_PRIZE,
    entryFeeCents: Number(row.entry_fee_cents || 0),
    accumulatedCents: Number(row.accumulated_cents || 0),
    predictedTeam1Score: team1Score,
    predictedTeam2Score: team2Score,
    predictedBrazilScore: team1Score,
    predictedOpponentScore: team2Score,
    status: row.prediction_status || row.status || 'pending',
    awardDescription: row.award_description || '',
    paymentId: row.payment_id || '',
    paymentStatus: row.payment_status || '',
    paymentMethod: row.payment_method || '',
    submittedAt: row.submitted_at,
    evaluatedAt: row.evaluated_at,
    redeemedAt: row.redeemed_at
  };
}

function sanitizeAdminUser(row = {}) {
  return {
    id: row.id,
    name: row.name || 'Usuário PetFunny',
    whatsapp: row.whatsapp || '',
    email: row.email || '',
    createdAt: row.created_at,
    approvedPaymentsCount: Number(row.approved_payments_count || 0),
    pendingPaymentsCount: Number(row.pending_payments_count || 0),
    approvedAmountCents: Number(row.approved_amount_cents || 0),
    predictionsCount: Number(row.predictions_count || 0),
    correctPredictionsCount: Number(row.correct_predictions_count || 0)
  };
}

const STANDINGS_GROUP_ORDER = [
  'Grupo A', 'Grupo B', 'Grupo C', 'Grupo D', 'Grupo E', 'Grupo F',
  'Grupo G', 'Grupo H', 'Grupo I', 'Grupo J', 'Grupo K', 'Grupo L',
  '16 avos', 'Oitavas de final', 'Quartas de final', 'Semifinal', 'Disputa 3º lugar', 'Final'
];

function groupSortValue(name = '') {
  const index = STANDINGS_GROUP_ORDER.indexOf(name);
  return index >= 0 ? index : 999;
}

const WORLD_CUP_2026_GROUPS = [
  { groupName: 'Grupo A', teams: [
    { code: 'MEX', name: 'México', flag: '/assets/img/flags/MEX.png' },
    { code: 'RSA', name: 'África do Sul', flag: '/assets/img/flags/RSA.png' },
    { code: 'KOR', name: 'Coreia do Sul', flag: '/assets/img/flags/KOR.png' },
    { code: 'CZE', name: 'Tchéquia', flag: '/assets/img/flags/CZE.png' }
  ]},
  { groupName: 'Grupo B', teams: [
    { code: 'CAN', name: 'Canadá', flag: '/assets/img/flags/CAN.png' },
    { code: 'BIH', name: 'Bósnia e Herzegovina', flag: '/assets/img/flags/BIH.png' },
    { code: 'QAT', name: 'Catar', flag: '/assets/img/flags/QAT.png' },
    { code: 'SUI', name: 'Suíça', flag: '/assets/img/flags/SUI.png' }
  ]},
  { groupName: 'Grupo C', teams: [
    { code: 'BRA', name: 'Brasil', flag: '/assets/img/flags/BRA.png' },
    { code: 'MAR', name: 'Marrocos', flag: '/assets/img/flags/MAR.png' },
    { code: 'HAI', name: 'Haiti', flag: '/assets/img/flags/HAI.png' },
    { code: 'SCO', name: 'Escócia', flag: '/assets/img/flags/SCO.png' }
  ]},
  { groupName: 'Grupo D', teams: [
    { code: 'USA', name: 'Estados Unidos', flag: '/assets/img/flags/USA.png' },
    { code: 'PAR', name: 'Paraguai', flag: '/assets/img/flags/PAR.png' },
    { code: 'AUS', name: 'Austrália', flag: '/assets/img/flags/AUS.png' },
    { code: 'TUR', name: 'Turquia', flag: '/assets/img/flags/TUR.png' }
  ]},
  { groupName: 'Grupo E', teams: [
    { code: 'GER', name: 'Alemanha', flag: '/assets/img/flags/GER.png' },
    { code: 'CUW', name: 'Curaçao', flag: '/assets/img/flags/CUW.png' },
    { code: 'CIV', name: 'Costa do Marfim', flag: '/assets/img/flags/CIV.png' },
    { code: 'ECU', name: 'Equador', flag: '/assets/img/flags/ECU.png' }
  ]},
  { groupName: 'Grupo F', teams: [
    { code: 'NED', name: 'Holanda', flag: '/assets/img/flags/NED.png' },
    { code: 'JPN', name: 'Japão', flag: '/assets/img/flags/JPN.png' },
    { code: 'SWE', name: 'Suécia', flag: '/assets/img/flags/SWE.png' },
    { code: 'TUN', name: 'Tunísia', flag: '/assets/img/flags/TUN.png' }
  ]},
  { groupName: 'Grupo G', teams: [
    { code: 'BEL', name: 'Bélgica', flag: '/assets/img/flags/BEL.png' },
    { code: 'EGY', name: 'Egito', flag: '/assets/img/flags/EGY.png' },
    { code: 'IRN', name: 'Irã', flag: '/assets/img/flags/IRN.png' },
    { code: 'NZL', name: 'Nova Zelândia', flag: '/assets/img/flags/NZL.png' }
  ]},
  { groupName: 'Grupo H', teams: [
    { code: 'ESP', name: 'Espanha', flag: '/assets/img/flags/ESP.png' },
    { code: 'CPV', name: 'Cabo Verde', flag: '/assets/img/flags/CPV.png' },
    { code: 'KSA', name: 'Arábia Saudita', flag: '/assets/img/flags/KSA.png' },
    { code: 'URU', name: 'Uruguai', flag: '/assets/img/flags/URU.png' }
  ]},
  { groupName: 'Grupo I', teams: [
    { code: 'FRA', name: 'França', flag: '/assets/img/flags/FRA.png' },
    { code: 'SEN', name: 'Senegal', flag: '/assets/img/flags/SEN.png' },
    { code: 'IRQ', name: 'Iraque', flag: '/assets/img/flags/IRQ.png' },
    { code: 'NOR', name: 'Noruega', flag: '/assets/img/flags/NOR.png' }
  ]},
  { groupName: 'Grupo J', teams: [
    { code: 'ARG', name: 'Argentina', flag: '/assets/img/flags/ARG.png' },
    { code: 'ALG', name: 'Argélia', flag: '/assets/img/flags/ALG.png' },
    { code: 'AUT', name: 'Áustria', flag: '/assets/img/flags/AUT.png' },
    { code: 'JOR', name: 'Jordânia', flag: '/assets/img/flags/JOR.png' }
  ]},
  { groupName: 'Grupo K', teams: [
    { code: 'POR', name: 'Portugal', flag: '/assets/img/flags/POR.png' },
    { code: 'COD', name: 'RD Congo', flag: '/assets/img/flags/COD.png' },
    { code: 'UZB', name: 'Uzbequistão', flag: '/assets/img/flags/UZB.png' },
    { code: 'COL', name: 'Colômbia', flag: '/assets/img/flags/COL.png' }
  ]},
  { groupName: 'Grupo L', teams: [
    { code: 'ENG', name: 'Inglaterra', flag: '/assets/img/flags/ENG.png' },
    { code: 'CRO', name: 'Croácia', flag: '/assets/img/flags/CRO.png' },
    { code: 'GHA', name: 'Gana', flag: '/assets/img/flags/GHA.png' },
    { code: 'PAN', name: 'Panamá', flag: '/assets/img/flags/PAN.png' }
  ]}
];

const WORLD_CUP_TEAM_INDEX = WORLD_CUP_2026_GROUPS.flatMap((group) =>
  group.teams.map((team) => ({ ...team, groupName: group.groupName }))
);

function teamLookupKey(value = '') {
  return cleanText(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function officialTeam(code = '', name = '') {
  const codeKey = teamLookupKey(code);
  const nameKey = teamLookupKey(name);
  return WORLD_CUP_TEAM_INDEX.find((team) => teamLookupKey(team.code) === codeKey || teamLookupKey(team.name) === nameKey) || null;
}

function completeTeamData({ code = '', name = '', flag = '' } = {}) {
  const official = officialTeam(code, name);
  return {
    code: cleanText(code) || official?.code || '',
    name: cleanText(name) || official?.name || 'Seleção',
    flag: official?.flag || cleanText(flag) || '',
    groupName: official?.groupName || ''
  };
}

function gameTeamData(row = {}, side = 'team1') {
  const name = side === 'team1' ? gameTeam1(row) : gameTeam2(row);
  return completeTeamData({
    code: row?.[`${side}_code`] || row?.[`${side}Code`] || '',
    name,
    flag: row?.[`${side}_flag`] || row?.[`${side}Flag`] || ''
  });
}

function isOfficialGroupName(value = '') {
  return /^Grupo [A-L]$/.test(cleanText(value));
}

function groupForGame(row = {}) {
  const savedGroup = cleanText(row.game_group || row.group_name) || 'Grupo A';
  const team1 = gameTeamData(row, 'team1');
  const team2 = gameTeamData(row, 'team2');
  if (team1.groupName && team1.groupName === team2.groupName) return team1.groupName;
  return savedGroup;
}

function shouldUseGameInGroupStandings(row = {}) {
  const groupName = groupForGame(row);
  if (!isOfficialGroupName(groupName)) return false;
  const team1 = gameTeamData(row, 'team1');
  const team2 = gameTeamData(row, 'team2');
  return team1.groupName === groupName && team2.groupName === groupName;
}

const KNOCKOUT_ROUNDS = ['16 avos', 'Oitavas de final', 'Quartas de final', 'Semifinal', 'Disputa 3º lugar', 'Final'];

function emptyStandingTeam({ code = '', name = 'Seleção', flag = '' } = {}) {
  return {
    key: cleanText(code) || cleanText(name).toLowerCase(),
    code: cleanText(code),
    name: cleanText(name) || 'Seleção',
    flag: cleanText(flag),
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
  };
}

function buildWorldCupStandings(rows = []) {
  const groups = new Map();

  function ensureGroup(name) {
    const groupName = cleanText(name) || 'Grupo A';
    if (!groups.has(groupName)) groups.set(groupName, new Map());
    return groups.get(groupName);
  }

  function ensureTeam(groupTeams, team) {
    const base = emptyStandingTeam(team);
    const key = base.code || base.name.toLowerCase();
    if (!groupTeams.has(key)) groupTeams.set(key, base);
    const existing = groupTeams.get(key);
    if (!existing.flag && base.flag) existing.flag = base.flag;
    if (!existing.code && base.code) existing.code = base.code;
    if (existing.name === 'Seleção' && base.name) existing.name = base.name;
    return existing;
  }

  WORLD_CUP_2026_GROUPS.forEach((group) => {
    const groupTeams = ensureGroup(group.groupName);
    group.teams.forEach((team) => ensureTeam(groupTeams, team));
  });

  rows
    .filter(shouldUseGameInGroupStandings)
    .forEach((row) => {
      const resolvedGroup = groupForGame(row);
      const groupTeams = ensureGroup(resolvedGroup);
      const team1 = ensureTeam(groupTeams, gameTeamData(row, 'team1'));
      const team2 = ensureTeam(groupTeams, gameTeamData(row, 'team2'));
      const score1 = row.brazil_score;
      const score2 = row.opponent_score;
      const isFinished = row.status === 'finished' && score1 !== null && score1 !== undefined && score2 !== null && score2 !== undefined;
      if (!isFinished) return;

      const goals1 = Number(score1);
      const goals2 = Number(score2);
      team1.played += 1;
      team2.played += 1;
      team1.goalsFor += goals1;
      team1.goalsAgainst += goals2;
      team2.goalsFor += goals2;
      team2.goalsAgainst += goals1;

      if (goals1 > goals2) {
        team1.wins += 1; team1.points += 3;
        team2.losses += 1;
      } else if (goals2 > goals1) {
        team2.wins += 1; team2.points += 3;
        team1.losses += 1;
      } else {
        team1.draws += 1; team2.draws += 1;
        team1.points += 1; team2.points += 1;
      }

      team1.goalDifference = team1.goalsFor - team1.goalsAgainst;
      team2.goalDifference = team2.goalsFor - team2.goalsAgainst;
    });

  return Array.from(groups.entries())
    .filter(([groupName]) => groupName.startsWith('Grupo '))
    .sort(([a], [b]) => groupSortValue(a) - groupSortValue(b) || a.localeCompare(b, 'pt-BR'))
    .map(([groupName, teamsMap]) => ({
      groupName,
      teams: Array.from(teamsMap.values()).sort((a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.name.localeCompare(b.name, 'pt-BR')
      )
    }));
}

function buildWorldCupKnockout(rows = []) {
  return KNOCKOUT_ROUNDS.map((roundName) => ({
    roundName,
    games: rows
      .filter((row) => cleanText(row.game_group) === roundName)
      .sort((a, b) => String(a.match_date).localeCompare(String(b.match_date)) || String(a.match_time).localeCompare(String(b.match_time)))
      .map((row) => ({
        id: row.id,
        roundName,
        groupName: row.game_group,
        team1Name: gameTeamData(row, 'team1').name,
        team1Code: gameTeamData(row, 'team1').code,
        team1Flag: gameTeamData(row, 'team1').flag,
        team2Name: gameTeamData(row, 'team2').name,
        team2Code: gameTeamData(row, 'team2').code,
        team2Flag: gameTeamData(row, 'team2').flag,
        matchDate: toIsoDate(row.match_date),
        matchTime: toTime(row.match_time),
        status: row.status || 'scheduled',
        team1Score: row.brazil_score === null || row.brazil_score === undefined ? null : Number(row.brazil_score),
        team2Score: row.opponent_score === null || row.opponent_score === undefined ? null : Number(row.opponent_score)
      }))
  }));
}

function buildWorldCupTable(rows = []) {
  return {
    groups: buildWorldCupStandings(rows),
    knockout: buildWorldCupKnockout(rows),
    updatedAt: new Date().toISOString()
  };
}

function predictionWinnerFromGame(row = {}) {
  const hasResult = row.brazil_score !== null && row.brazil_score !== undefined && row.opponent_score !== null && row.opponent_score !== undefined;
  if (!hasResult) return false;
  return Number(row.predicted_brazil_score) === Number(row.brazil_score) && Number(row.predicted_opponent_score) === Number(row.opponent_score);
}

function predictionPublicStatus(row = {}) {
  if (row.status === 'awarded') return 'awarded';
  if (predictionWinnerFromGame(row)) return 'correct';
  const hasResult = row.brazil_score !== null && row.brazil_score !== undefined && row.opponent_score !== null && row.opponent_score !== undefined;
  if (hasResult) return 'wrong';
  return row.status || 'pending';
}

function gamePayload(body = {}) {
  const rawTeam1Name = cleanText(body.team1Name || body.team1_name || body.team1 || body.title || 'Brasil');
  const rawTeam2Name = cleanText(body.team2Name || body.team2_name || body.team2 || body.opponent);
  const team1 = completeTeamData({ code: body.team1Code || body.team1_code, name: rawTeam1Name, flag: body.team1Flag || body.team1_flag });
  const team2 = completeTeamData({ code: body.team2Code || body.team2_code, name: rawTeam2Name, flag: body.team2Flag || body.team2_flag });
  const team1Name = team1.name;
  const team2Name = team2.name;
  const matchDate = normalizeDateInput(body.matchDate || body.match_date);
  if (!team1Name) throw Object.assign(new Error('Informe o time 1.'), { status: 400 });
  if (!team2Name) throw Object.assign(new Error('Informe o time 2.'), { status: 400 });
  if (teamLookupKey(team1Name) === teamLookupKey(team2Name)) throw Object.assign(new Error('Time 1 e Time 2 precisam ser diferentes.'), { status: 400 });
  if (!matchDate) throw Object.assign(new Error('Informe a data do jogo.'), { status: 400 });
  const status = cleanText(body.status) || 'scheduled';
  const allowedStatus = ['scheduled', 'open', 'closed', 'finished', 'canceled'];
  return {
    title: cleanText(body.title) || `${team1Name} x ${team2Name}`,
    team1Name,
    team1Code: team1.code,
    team1Flag: team1.flag,
    team2Name,
    team2Code: team2.code,
    team2Flag: team2.flag,
    opponent: team2Name,
    groupName: cleanText(body.groupName || body.group_name || body.gameGroup || body.game_group) || (team1.groupName === team2.groupName ? team1.groupName : 'Grupo A'),
    roundName: cleanText(body.roundName || body.round_name),
    matchDate,
    matchTime: normalizeTimeInput(body.matchTime || body.match_time),
    status: allowedStatus.includes(status) ? status : 'scheduled',
    brazilScore: normalizeScore(body.team1Score ?? body.team1_score ?? body.brazilScore ?? body.brazil_score),
    opponentScore: normalizeScore(body.team2Score ?? body.team2_score ?? body.opponentScore ?? body.opponent_score),
    prizeDescription: cleanText(body.prizeDescription || body.prize_description) || DEFAULT_PRIZE,
    entryFeeCents: parseAmountCents(body.entryFee ?? body.entry_fee ?? body.entryFeeCents ?? body.entry_fee_cents, 1000),
    isActive: parseBool(body.isActive ?? body.is_active, true)
  };
}
async function hashPassword(password) {
  return bcrypt.hash(cleanText(password), 10);
}

async function verifyPassword(password, hash) {
  if (!hash) return false;
  return bcrypt.compare(cleanText(password), hash);
}

function validatePassword(password) {
  const value = cleanText(password);
  if (value.length < 6) throw Object.assign(new Error('A senha precisa ter pelo menos 6 caracteres.'), { status: 400 });
  return value;
}

function normalizePixKeyType(value = '') {
  const raw = cleanText(value || '').toLowerCase();
  return ['cpf', 'cnpj', 'email', 'celular', 'aleatoria'].includes(raw) ? raw : 'cpf';
}

function validatePixPayload(body = {}, options = {}) {
  const pixKeyType = normalizePixKeyType(body.pixKeyType || body.pix_key_type);
  let pixKey = cleanText(body.pixKey || body.pix_key);
  if (pixKeyType === 'cpf' || pixKeyType === 'cnpj' || pixKeyType === 'celular') {
    pixKey = onlyDigits(pixKey);
  }
  if (options.required && pixKey.length < 3) throw Object.assign(new Error('Cadastre uma chave Pix válida para solicitar o resgate.'), { status: 400 });
  if (pixKey && pixKeyType === 'email' && !pixKey.includes('@')) throw Object.assign(new Error('Informe uma chave Pix de e-mail válida.'), { status: 400 });
  if (pixKey && pixKeyType === 'cpf' && pixKey.length !== 11) throw Object.assign(new Error('Informe uma chave Pix CPF com 11 dígitos.'), { status: 400 });
  if (pixKey && pixKeyType === 'cnpj' && pixKey.length !== 14) throw Object.assign(new Error('Informe uma chave Pix CNPJ com 14 dígitos.'), { status: 400 });
  if (pixKey && pixKeyType === 'celular' && pixKey.length < 10) throw Object.assign(new Error('Informe uma chave Pix celular com DDD.'), { status: 400 });
  return { pixKeyType, pixKey };
}

function validateParticipantPayload(body = {}, mode = 'register') {
  const fullName = cleanText(body.fullName || body.name);
  const email = normalizeEmail(body.email);
  const whatsapp = onlyDigits(body.whatsapp);
  const password = cleanText(body.password);
  const pix = validatePixPayload(body, { required: false });
  if (mode === 'register' && fullName.length < 3) throw Object.assign(new Error('Informe seu nome completo.'), { status: 400 });
  if (!email || !email.includes('@')) throw Object.assign(new Error('Informe um e-mail válido.'), { status: 400 });
  if (mode === 'register' && whatsapp.length < 10) throw Object.assign(new Error('Informe um WhatsApp válido com DDD.'), { status: 400 });
  validatePassword(password);
  return { fullName, email, whatsapp, password, ...pix };
}

async function closeGamesForPredictionDeadline() {
  return query(`
    UPDATE world_cup_games
    SET status='closed', updated_at=NOW()
    WHERE deleted_at IS NULL
      AND is_active = TRUE
      AND status IN ('scheduled','open')
      AND match_date IS NOT NULL
      AND (match_date + COALESCE(match_time, TIME '16:00')) <= ((NOW() AT TIME ZONE 'America/Sao_Paulo') + ($1::int * INTERVAL '1 minute'))
    RETURNING id
  `, [PREDICTION_CLOSE_MINUTES]).catch((error) => {
    console.warn('[bolao] não foi possível fechar jogos automaticamente:', error.message);
    return { rows: [], rowCount: 0 };
  });
}

async function evaluateGame(gameId) {
  const gameResult = await query('SELECT * FROM world_cup_games WHERE id=$1::uuid AND deleted_at IS NULL', [gameId]);
  const game = gameResult.rows[0];
  if (!game) throw Object.assign(new Error('Jogo do bolão não encontrado.'), { status: 404 });
  if (game.brazil_score === null || game.opponent_score === null || game.brazil_score === undefined || game.opponent_score === undefined) {
    return { game: sanitizeGame(game), predictions: [], winners: 0 };
  }
  const predictions = await query(`
    UPDATE world_cup_predictions wp
    SET status = CASE
        WHEN wp.predicted_brazil_score = $2::int AND wp.predicted_opponent_score = $3::int THEN 'correct'
        ELSE 'wrong'
      END,
      award_description = CASE
        WHEN wp.predicted_brazil_score = $2::int AND wp.predicted_opponent_score = $3::int THEN $4::text
        ELSE NULL
      END,
      evaluated_at = NOW(),
      updated_at = NOW()
    WHERE wp.game_id=$1::uuid
      AND wp.deleted_at IS NULL
      AND wp.status IN ('pending','correct','wrong')
    RETURNING *
  `, [game.id, Number(game.brazil_score), Number(game.opponent_score), game.prize_description || DEFAULT_PRIZE]);
  const winners = predictions.rows.filter((row) => row.status === 'correct').length;
  return { game: sanitizeGame(game), predictions: predictions.rows.map(sanitizePrediction), winners };
}

function paymentStatusFromMercadoPago(status = '') {
  const value = cleanText(status).toLowerCase();
  if (value === 'approved') return 'approved';
  if (['rejected', 'cancelled', 'canceled', 'refunded', 'charged_back', 'expired'].includes(value)) return value === 'canceled' ? 'cancelled' : value;
  if (['pending', 'in_process', 'authorized'].includes(value)) return 'pending';
  return value || 'pending';
}

async function mercadoPagoRequest(endpoint, options = {}) {
  if (!MP_ACCESS_TOKEN) {
    throw Object.assign(new Error('Mercado Pago não configurado. Defina MERCADO_PAGO_ACCESS_TOKEN no .env ou no Render.'), { status: 503, code: 'MP_NOT_CONFIGURED' });
  }
  const response = await fetch(`https://api.mercadopago.com${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.idempotencyKey ? { 'X-Idempotency-Key': options.idempotencyKey } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error || `Erro Mercado Pago ${response.status}`;
    throw Object.assign(new Error(message), { status: response.status, mercadoPago: data });
  }
  return data;
}

function splitName(fullName = '') {
  const parts = cleanText(fullName).split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() || 'Cliente',
    lastName: parts.join(' ') || 'PetFunny'
  };
}

function mpPayer(tutor = {}, mode = 'preference') {
  const { firstName, lastName } = splitName(tutor.name);
  const digits = onlyDigits(tutor.whatsapp);
  const phone = digits.length >= 10 ? {
    area_code: digits.slice(0, 2),
    number: digits.slice(2)
  } : undefined;

  if (mode === 'payment') {
    const payer = {
      email: tutor.email || 'cliente@petfunny.com.br',
      first_name: firstName,
      last_name: lastName
    };
    if (phone) payer.phone = phone;
    return payer;
  }

  const payer = {
    email: tutor.email || 'cliente@petfunny.com.br',
    name: firstName,
    surname: lastName
  };
  if (phone) payer.phone = phone;
  return payer;
}

async function gameWithPaymentStats(gameId) {
  const result = await query(`
    SELECT g.*,
           COALESCE(SUM(bp.amount_cents) FILTER (WHERE bp.status='approved' AND bp.deleted_at IS NULL), 0)::int AS accumulated_cents,
           COUNT(bp.id) FILTER (WHERE bp.status='approved' AND bp.deleted_at IS NULL)::int AS participants_count
    FROM world_cup_games g
    LEFT JOIN bolao_payments bp ON bp.game_id = g.id
    WHERE g.id=$1::uuid AND g.deleted_at IS NULL
    GROUP BY g.id
  `, [gameId]);
  return result.rows[0] || null;
}

async function createLocalPayment({ tutor, game, method }) {
  const approved = await query(`
    SELECT * FROM bolao_payments
    WHERE tutor_id=$1::uuid AND game_id=$2::uuid AND status='approved' AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
  `, [tutor.id, game.id]);
  if (approved.rows[0]) return approved.rows[0];

  const result = await query(`
    INSERT INTO bolao_payments (tutor_id, game_id, amount_cents, currency, status, method, provider)
    VALUES ($1::uuid, $2::uuid, $3::int, 'BRL', 'pending', $4::text, 'mercado_pago')
    RETURNING *
  `, [tutor.id, game.id, Number(game.entry_fee_cents || 0), method]);
  return result.rows[0];
}

async function ensureGameCanReceivePayment(gameId) {
  await closeGamesForPredictionDeadline();
  const result = await query(`
    SELECT *, ((match_date + COALESCE(match_time, TIME '16:00')) > ((NOW() AT TIME ZONE 'America/Sao_Paulo') + ($2::int * INTERVAL '1 minute')) AND status IN ('scheduled','open')) AS is_open
    FROM world_cup_games
    WHERE id=$1::uuid AND deleted_at IS NULL AND is_active = TRUE
  `, [gameId, PREDICTION_CLOSE_MINUTES]);
  const game = result.rows[0];
  if (!game) throw Object.assign(new Error('Jogo do Bolão da Copa não encontrado.'), { status: 404 });
  if (!game.is_open) throw Object.assign(new Error('Bolão encerrado para este jogo.'), { status: 400 });
  if (Number(game.entry_fee_cents || 0) <= 0) throw Object.assign(new Error('Este jogo não possui cobrança configurada.'), { status: 400 });
  return game;
}

async function updatePaymentFromMpPayload({ localPaymentId, mercadoPagoPaymentId, status, rawPayload = {}, extra = {} }) {
  const mappedStatus = paymentStatusFromMercadoPago(status || rawPayload?.status);
  const result = await query(`
    UPDATE bolao_payments
    SET status=$2::text,
        mercado_pago_payment_id=COALESCE(NULLIF($3::text,''), mercado_pago_payment_id),
        raw_payload=$4::jsonb,
        updated_at=NOW(),
        checkout_url=COALESCE(NULLIF($5::text,''), checkout_url),
        pix_qr_code=COALESCE(NULLIF($6::text,''), pix_qr_code),
        pix_qr_code_base64=COALESCE(NULLIF($7::text,''), pix_qr_code_base64)
    WHERE id=$1::uuid AND deleted_at IS NULL
    RETURNING *
  `, [
    localPaymentId,
    mappedStatus,
    cleanText(mercadoPagoPaymentId || rawPayload?.id),
    JSON.stringify(rawPayload || {}),
    cleanText(extra.checkoutUrl),
    cleanText(extra.pixQrCode),
    cleanText(extra.pixQrCodeBase64)
  ]);
  return result.rows[0] || null;
}

function localPaymentIdFromExternalReference(value = '') {
  const raw = cleanText(value);
  if (raw.startsWith('bolao:')) return raw.split(':')[1] || '';
  return '';
}

async function getTutorBolaoPayload(tutorId) {
  await closeGamesForPredictionDeadline();
  const result = await query(`
    SELECT g.*,
           ((g.match_date + COALESCE(g.match_time, TIME '16:00')) > ((NOW() AT TIME ZONE 'America/Sao_Paulo') + ($2::int * INTERVAL '1 minute')) AND g.status IN ('scheduled','open')) AS is_open,
           COALESCE(stats.accumulated_cents, 0)::int AS accumulated_cents,
           COALESCE(stats.participants_count, 0)::int AS participants_count,
           wp.id AS prediction_id,
           wp.predicted_brazil_score,
           wp.predicted_opponent_score,
           wp.status AS prediction_status,
           wp.award_description,
           wp.submitted_at,
           wp.evaluated_at,
           wp.redeemed_at,
           mypay.id AS payment_id,
           mypay.status AS payment_status,
           mypay.method AS payment_method,
           mypay.provider AS payment_provider,
           mypay.amount_cents AS payment_amount_cents,
           mypay.currency AS payment_currency,
           mypay.preference_id,
           mypay.mercado_pago_payment_id,
           mypay.checkout_url,
           mypay.pix_qr_code,
           mypay.pix_qr_code_base64,
           mypay.created_at AS payment_created_at,
           mypay.updated_at AS payment_updated_at
    FROM world_cup_games g
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(bp.amount_cents) FILTER (WHERE bp.status='approved'), 0)::int AS accumulated_cents,
             COUNT(bp.id) FILTER (WHERE bp.status='approved')::int AS participants_count
      FROM bolao_payments bp
      WHERE bp.game_id = g.id AND bp.deleted_at IS NULL
    ) stats ON TRUE
    LEFT JOIN LATERAL (
      SELECT * FROM bolao_payments bp
      WHERE bp.game_id = g.id AND bp.tutor_id = $1::uuid AND bp.deleted_at IS NULL
      ORDER BY CASE WHEN bp.status='approved' THEN 0 WHEN bp.status='pending' THEN 1 ELSE 2 END, bp.created_at DESC
      LIMIT 1
    ) mypay ON TRUE
    LEFT JOIN world_cup_predictions wp ON wp.game_id = g.id AND wp.tutor_id = $1::uuid AND wp.deleted_at IS NULL
    WHERE g.deleted_at IS NULL
      AND g.is_active = TRUE
      AND g.status <> 'canceled'
    ORDER BY g.match_date ASC, g.match_time ASC, g.created_at DESC
    LIMIT 500
  `, [tutorId, PREDICTION_CLOSE_MINUTES]);
  const games = result.rows.map((row) => ({
    ...sanitizeGame(row),
    myPayment: sanitizePayment(row),
    myPrediction: row.prediction_id ? sanitizePrediction({ ...row, id: row.prediction_id, status: row.prediction_status }) : null
  }));
  const openGame = games.find((game) => game.isOpen && !game.myPrediction) || games.find((game) => game.isOpen) || games.find((game) => game.status !== 'finished') || games[0] || null;
  const winners = games.filter((game) => ['correct', 'awarded'].includes(game.myPrediction?.status)).length;
  const totalAccumulatedCents = games.reduce((sum, game) => sum + Number(game.accumulatedCents || 0), 0);
  return { ok: true, games, openGame, winners, totalAccumulatedCents, totalAccumulated: centsToAmount(totalAccumulatedCents), prize: DEFAULT_PRIZE, title: process.env.APP_NAME || 'Bolão da Copa PetFunny', ...publicBolaoRules() };
}

app.get('/', (_req, res) => res.redirect('/app'));
app.get('/admin', (_req, res) => res.sendFile(path.join(frontendDir, 'pages/admin/index.html')));
app.get('/app', (_req, res) => res.sendFile(path.join(frontendDir, 'pages/app/index.html')));
app.get('/app/bolao-copa', (_req, res) => res.sendFile(path.join(frontendDir, 'pages/app/index.html')));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'bolao-copa-petfunny', payments: { mercadoPagoConfigured: Boolean(MP_ACCESS_TOKEN) } }));

app.post('/api/admin/login', (req, res) => {
  const email = cleanText(req.body?.email).toLowerCase();
  const password = cleanText(req.body?.password);
  const adminEmail = cleanText(process.env.ADMIN_EMAIL || 'admin@petfunny.com.br').toLowerCase();
  const adminPassword = cleanText(process.env.ADMIN_PASSWORD || 'petfunny123');
  if (email !== adminEmail || password !== adminPassword) return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
  res.json({ ok: true, token: signAdminToken(), admin: { email: adminEmail, name: 'Admin Bolão' } });
});

app.get('/api/admin/me', requireAdmin, (_req, res) => {
  res.json({ ok: true, admin: { email: process.env.ADMIN_EMAIL || 'admin@petfunny.com.br', name: 'Admin Bolão' } });
});

app.post('/api/app/auth/register', async (req, res, next) => {
  try {
    const payload = validateParticipantPayload(req.body, 'register');
    const existing = await query(`
      SELECT id, email, whatsapp FROM tutors
      WHERE deleted_at IS NULL AND (LOWER(email)=LOWER($1::text) OR whatsapp=$2::text)
      LIMIT 1
    `, [payload.email, payload.whatsapp]);
    if (existing.rows[0]) return res.status(409).json({ error: 'Já existe cadastro com este e-mail ou WhatsApp. Entre com sua senha.' });
    const result = await query(`
      INSERT INTO tutors (name, whatsapp, email, password_hash, pix_key_type, pix_key)
      VALUES ($1::text, $2::text, $3::text, $4::text, NULLIF($5::text,''), NULLIF($6::text,''))
      RETURNING *
    `, [payload.fullName, payload.whatsapp, payload.email, await hashPassword(payload.password), payload.pixKeyType || '', payload.pixKey || '']);
    const tutor = result.rows[0];
    res.status(201).json({ ok: true, token: signTutorToken(tutor), tutor: sanitizeTutor(tutor), message: 'Cadastro criado. Agora escolha o jogo e pague para participar.' });
  } catch (error) { next(error); }
});

app.post('/api/app/auth/login', async (req, res, next) => {
  try {
    const credential = cleanText(req.body?.email || req.body?.credential).toLowerCase();
    const password = validatePassword(req.body?.password);
    if (!credential) return res.status(400).json({ error: 'Informe seu e-mail ou WhatsApp.' });
    const digits = onlyDigits(credential);
    const result = await query(`
      SELECT * FROM tutors
      WHERE deleted_at IS NULL
        AND (LOWER(email)=LOWER($1::text) OR whatsapp=$2::text)
      LIMIT 1
    `, [credential, digits]);
    const tutor = result.rows[0];
    if (!tutor || !(await verifyPassword(password, tutor.password_hash))) return res.status(401).json({ error: 'E-mail/WhatsApp ou senha inválidos.' });
    res.json({ ok: true, token: signTutorToken(tutor), tutor: sanitizeTutor(tutor), message: 'Entrada realizada com sucesso.' });
  } catch (error) { next(error); }
});


app.post('/api/app/auth/forgot-password', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Informe um e-mail válido.' });

    const generic = { ok: true, message: 'Se o e-mail estiver cadastrado, enviaremos um link para cadastrar uma nova senha.' };
    const result = await query('SELECT * FROM tutors WHERE LOWER(email)=LOWER($1::text) AND deleted_at IS NULL LIMIT 1', [email]);
    const tutor = result.rows[0];
    if (!tutor) return res.json(generic);

    const token = base64UrlToken(32);
    const resetUrl = `${PUBLIC_BASE_URL}/app?resetToken=${encodeURIComponent(token)}`;
    await query(`
      UPDATE tutors
      SET reset_password_token_hash=$2::text,
          reset_password_expires_at=NOW() + ($3::int * INTERVAL '1 minute'),
          updated_at=NOW()
      WHERE id=$1::uuid
    `, [tutor.id, hashToken(token), RESET_TOKEN_EXPIRES_MINUTES]);

    const emailResult = await sendPasswordResetEmail({ to: tutor.email, name: tutor.name, resetUrl });
    res.json({
      ...generic,
      emailSent: emailResult.sent,
      ...(!emailResult.sent && !isProduction() ? { resetUrl } : {})
    });
  } catch (error) { next(error); }
});

app.post('/api/app/auth/reset-password', async (req, res, next) => {
  try {
    const token = cleanText(req.body?.token);
    const password = validatePassword(req.body?.password);
    if (!token) return res.status(400).json({ error: 'Link de redefinição inválido.' });

    const result = await query(`
      SELECT * FROM tutors
      WHERE reset_password_token_hash=$1::text
        AND reset_password_expires_at > NOW()
        AND deleted_at IS NULL
      LIMIT 1
    `, [hashToken(token)]);
    const tutor = result.rows[0];
    if (!tutor) return res.status(400).json({ error: 'Link expirado ou inválido. Solicite um novo link.' });

    const updated = await query(`
      UPDATE tutors
      SET password_hash=$2::text,
          reset_password_token_hash=NULL,
          reset_password_expires_at=NULL,
          updated_at=NOW()
      WHERE id=$1::uuid
      RETURNING *
    `, [tutor.id, await hashPassword(password)]);

    const loggedTutor = updated.rows[0];
    res.json({ ok: true, token: signTutorToken(loggedTutor), tutor: sanitizeTutor(loggedTutor), message: 'Senha redefinida. Você entrou no Bolão da Copa PetFunny.' });
  } catch (error) { next(error); }
});


// Compatibilidade com a versão anterior: cria cadastro sem senha apenas se ainda não existir.
app.post('/api/app/auth/whatsapp', async (req, res, next) => {
  try {
    const whatsapp = onlyDigits(req.body?.whatsapp);
    const name = cleanText(req.body?.name || req.body?.fullName) || 'Participante PetFunny';
    const email = normalizeEmail(req.body?.email);
    const password = cleanText(req.body?.password || '');
    if (password) return res.status(400).json({ error: 'Use a tela nova de cadastro/login com e-mail e senha.' });
    if (whatsapp.length < 10) return res.status(400).json({ error: 'Informe um WhatsApp válido com DDD.' });
    let result = await query('SELECT * FROM tutors WHERE whatsapp=$1 AND deleted_at IS NULL', [whatsapp]);
    let tutor = result.rows[0];
    if (!tutor) {
      result = await query(`
        INSERT INTO tutors (name, whatsapp, email)
        VALUES ($1::text, $2::text, NULLIF($3::text,''))
        RETURNING *
      `, [name, whatsapp, email]);
      tutor = result.rows[0];
    }
    res.json({ ok: true, token: signTutorToken(tutor), tutor: sanitizeTutor(tutor) });
  } catch (error) { next(error); }
});

app.get('/api/app/me', requireTutor, (req, res) => {
  res.json({ ok: true, tutor: sanitizeTutor(req.tutor) });
});

app.put('/api/app/me/pix', requireTutor, async (req, res, next) => {
  try {
    const pix = validatePixPayload(req.body, { required: true });
    const result = await query(`
      UPDATE tutors
      SET pix_key_type=$2::text, pix_key=$3::text, updated_at=NOW()
      WHERE id=$1::uuid AND deleted_at IS NULL
      RETURNING *
    `, [req.tutor.id, pix.pixKeyType, pix.pixKey]);
    res.json({ ok: true, tutor: sanitizeTutor(result.rows[0]), message: 'Chave Pix de resgate salva com segurança.' });
  } catch (error) { next(error); }
});

function redemptionDeadlineText() {
  return 'até 3 dias úteis após a solicitação';
}

function publicBolaoRules() {
  return {
    platformFeePercent: 10,
    payoutPercent: 90,
    redemptionDeadline: redemptionDeadlineText(),
    rules: [
      'Cada jogo possui um valor próprio de participação definido no admin.',
      'O palpite só é liberado após o pagamento aprovado pelo Mercado Pago.',
      'O palpite fecha 10 minutos antes do horário cadastrado para o jogo.',
      'O acumulado do jogo considera apenas pagamentos aprovados.',
      '10% do acumulado fica para manutenção e operação do aplicativo.',
      '90% do acumulado compõe o valor líquido destinado aos ganhadores.',
      'Ganha quem acertar exatamente o placar final cadastrado no admin.',
      'Se houver mais de um ganhador, o valor líquido é dividido igualmente entre eles.',
      'O resgate do prêmio deve ser solicitado no app usando a chave Pix cadastrada.',
      'O pagamento do resgate será processado em até 3 dias úteis após a solicitação.'
    ]
  };
}

async function getPrizeRowsForTutor(tutorId) {
  const result = await query(`
    SELECT wp.*, g.title AS game_title, g.opponent, g.game_group, g.round_name, g.match_date, g.match_time,
           g.team1_name, g.team1_code, g.team1_flag, g.team2_name, g.team2_code, g.team2_flag,
           g.prize_description, g.entry_fee_cents, g.brazil_score, g.opponent_score,
           COALESCE(pay.accumulated_cents, 0)::int AS accumulated_cents,
           COALESCE(win.winners_count, 0)::int AS winners_count,
           pr.id AS redemption_id, pr.status AS redemption_status, pr.amount_cents AS redemption_amount_cents,
           pr.platform_fee_cents AS redemption_platform_fee_cents, pr.pix_key_type AS redemption_pix_key_type,
           pr.pix_key AS redemption_pix_key, pr.requested_at AS redemption_requested_at, pr.paid_at AS redemption_paid_at
    FROM world_cup_predictions wp
    INNER JOIN world_cup_games g ON g.id = wp.game_id
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(bp.amount_cents) FILTER (WHERE bp.status='approved'), 0)::int AS accumulated_cents
      FROM bolao_payments bp
      WHERE bp.game_id = g.id AND bp.deleted_at IS NULL
    ) pay ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS winners_count
      FROM world_cup_predictions w2
      WHERE w2.game_id = g.id AND w2.deleted_at IS NULL AND w2.status IN ('correct','awarded')
    ) win ON TRUE
    LEFT JOIN LATERAL (
      SELECT * FROM prize_redemptions r
      WHERE r.prediction_id = wp.id AND r.deleted_at IS NULL
      ORDER BY r.created_at DESC
      LIMIT 1
    ) pr ON TRUE
    WHERE wp.tutor_id=$1::uuid
      AND wp.deleted_at IS NULL
      AND wp.status IN ('correct','awarded')
    ORDER BY g.match_date DESC, g.match_time DESC, wp.updated_at DESC
  `, [tutorId]);
  return result.rows;
}

function sanitizePrize(row = {}) {
  const prediction = sanitizePrediction(row);
  const accumulatedCents = Number(row.accumulated_cents || 0);
  const platformFeeCents = Math.floor(accumulatedCents * 0.10);
  const payoutPoolCents = Math.max(0, accumulatedCents - platformFeeCents);
  const winnersCount = Math.max(1, Number(row.winners_count || 1));
  const prizeCents = Number(row.redemption_amount_cents || 0) || Math.floor(payoutPoolCents / winnersCount);
  return {
    prediction,
    game: sanitizeGame({ ...row, id: row.game_id }),
    accumulatedCents,
    accumulatedAmount: centsToAmount(accumulatedCents),
    platformFeeCents,
    platformFeeAmount: centsToAmount(platformFeeCents),
    payoutPoolCents,
    payoutPoolAmount: centsToAmount(payoutPoolCents),
    winnersCount,
    prizeCents,
    prizeAmount: centsToAmount(prizeCents),
    redemption: row.redemption_id ? {
      id: row.redemption_id,
      status: row.redemption_status || 'requested',
      amountCents: Number(row.redemption_amount_cents || prizeCents),
      amount: centsToAmount(row.redemption_amount_cents || prizeCents),
      pixKeyType: row.redemption_pix_key_type || '',
      pixKey: row.redemption_pix_key || '',
      requestedAt: row.redemption_requested_at || null,
      paidAt: row.redemption_paid_at || null
    } : null
  };
}

app.get('/api/app/rules', requireTutor, (_req, res) => {
  res.json({ ok: true, ...publicBolaoRules() });
});

app.get('/api/app/prizes', requireTutor, async (req, res, next) => {
  try {
    const rows = await getPrizeRowsForTutor(req.tutor.id);
    res.json({ ok: true, prizes: rows.map(sanitizePrize), tutor: sanitizeTutor(req.tutor), ...publicBolaoRules() });
  } catch (error) { next(error); }
});

app.post('/api/app/prizes/:predictionId/redeem', requireTutor, async (req, res, next) => {
  try {
    const rows = await getPrizeRowsForTutor(req.tutor.id);
    const row = rows.find((item) => String(item.id) === String(req.params.predictionId));
    if (!row) return res.status(404).json({ error: 'Prêmio não encontrado para este usuário.' });
    if (row.redemption_id) return res.json({ ok: true, prize: sanitizePrize(row), message: 'Resgate já solicitado para este prêmio.' });

    const pixFromBody = cleanText(req.body?.pixKey || req.body?.pix_key);
    const pix = pixFromBody ? validatePixPayload(req.body, { required: true }) : validatePixPayload({ pixKeyType: req.tutor.pix_key_type, pixKey: req.tutor.pix_key }, { required: true });
    if (pixFromBody) {
      await query('UPDATE tutors SET pix_key_type=$2::text, pix_key=$3::text, updated_at=NOW() WHERE id=$1::uuid', [req.tutor.id, pix.pixKeyType, pix.pixKey]);
    }

    const prize = sanitizePrize(row);
    const inserted = await query(`
      INSERT INTO prize_redemptions (tutor_id, game_id, prediction_id, amount_cents, platform_fee_cents, accumulated_cents, winners_count, pix_key_type, pix_key, status)
      VALUES ($1::uuid, $2::uuid, $3::uuid, $4::int, $5::int, $6::int, $7::int, $8::text, $9::text, 'requested')
      RETURNING *
    `, [req.tutor.id, row.game_id, row.id, prize.prizeCents, prize.platformFeeCents, prize.accumulatedCents, prize.winnersCount, pix.pixKeyType, pix.pixKey]);

    res.status(201).json({
      ok: true,
      redemption: {
        id: inserted.rows[0].id,
        status: inserted.rows[0].status,
        amountCents: Number(inserted.rows[0].amount_cents || 0),
        amount: centsToAmount(inserted.rows[0].amount_cents || 0),
        pixKeyType: inserted.rows[0].pix_key_type,
        pixKey: inserted.rows[0].pix_key,
        requestedAt: inserted.rows[0].requested_at
      },
      tutor: sanitizeTutor({ ...req.tutor, pix_key_type: pix.pixKeyType, pix_key: pix.pixKey }),
      message: `Resgate solicitado com sucesso. O pagamento via Pix será feito ${redemptionDeadlineText()}.`
    });
  } catch (error) { next(error); }
});

app.get('/api/bolao-copa/summary', requireAdmin, async (_req, res, next) => {
  try {
    await closeGamesForPredictionDeadline();
    const result = await query(`
      SELECT
        COUNT(*)::int AS games_count,
        COUNT(*) FILTER (WHERE status IN ('scheduled','open') AND is_active = TRUE AND deleted_at IS NULL)::int AS active_games,
        COALESCE((SELECT COUNT(*)::int FROM world_cup_predictions WHERE deleted_at IS NULL), 0)::int AS predictions_count,
        COALESCE((SELECT COUNT(*)::int FROM world_cup_predictions WHERE deleted_at IS NULL AND status IN ('correct','awarded')), 0)::int AS winners_count,
        COALESCE((SELECT SUM(amount_cents)::int FROM bolao_payments WHERE deleted_at IS NULL AND status='approved'), 0)::int AS accumulated_cents,
        COALESCE((SELECT COUNT(*)::int FROM bolao_payments WHERE deleted_at IS NULL AND status='approved'), 0)::int AS paid_entries_count,
        COALESCE((SELECT COUNT(*)::int FROM bolao_payments WHERE deleted_at IS NULL AND status='pending'), 0)::int AS pending_payments_count
      FROM world_cup_games
      WHERE deleted_at IS NULL
    `);
    const row = result.rows[0] || {};
    res.json({ ok: true, summary: {
      gamesCount: Number(row.games_count || 0),
      activeGames: Number(row.active_games || 0),
      predictionsCount: Number(row.predictions_count || 0),
      winnersCount: Number(row.winners_count || 0),
      accumulatedCents: Number(row.accumulated_cents || 0),
      accumulated: centsToAmount(row.accumulated_cents || 0),
      paidEntriesCount: Number(row.paid_entries_count || 0),
      pendingPaymentsCount: Number(row.pending_payments_count || 0)
    }});
  } catch (error) { next(error); }
});

app.get('/api/bolao-copa/games', requireAdmin, async (_req, res, next) => {
  try {
    await closeGamesForPredictionDeadline();
    const result = await query(`
      SELECT g.*,
             ((g.match_date + COALESCE(g.match_time, TIME '16:00')) > ((NOW() AT TIME ZONE 'America/Sao_Paulo') + ($1::int * INTERVAL '1 minute')) AND g.status IN ('scheduled','open')) AS is_open,
             COALESCE(pay_stats.accumulated_cents, 0)::int AS accumulated_cents,
             COALESCE(pay_stats.participants_count, 0)::int AS participants_count,
             COALESCE(pred_stats.predictions_count, 0)::int AS predictions_count,
             COALESCE(pred_stats.correct_count, 0)::int AS correct_count,
             COALESCE(pred_stats.wrong_count, 0)::int AS wrong_count,
             COALESCE(pred_stats.awarded_count, 0)::int AS awarded_count
      FROM world_cup_games g
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(bp.amount_cents) FILTER (WHERE bp.status='approved'), 0)::int AS accumulated_cents,
               COUNT(bp.id) FILTER (WHERE bp.status='approved')::int AS participants_count
        FROM bolao_payments bp
        WHERE bp.game_id = g.id AND bp.deleted_at IS NULL
      ) pay_stats ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(wp.id)::int AS predictions_count,
               COUNT(wp.id) FILTER (WHERE wp.status IN ('correct','awarded'))::int AS correct_count,
               COUNT(wp.id) FILTER (WHERE wp.status = 'wrong')::int AS wrong_count,
               COUNT(wp.id) FILTER (WHERE wp.status = 'awarded')::int AS awarded_count
        FROM world_cup_predictions wp
        WHERE wp.game_id = g.id AND wp.deleted_at IS NULL
      ) pred_stats ON TRUE
      WHERE g.deleted_at IS NULL
      ORDER BY g.match_date ASC, g.match_time ASC, g.created_at DESC
    `, [PREDICTION_CLOSE_MINUTES]);
    res.json({ ok: true, games: result.rows.map(sanitizeGame) });
  } catch (error) { next(error); }
});

app.post('/api/bolao-copa/games', requireAdmin, async (req, res, next) => {
  try {
    const payload = gamePayload(req.body || {});
    const result = await query(`
      INSERT INTO world_cup_games (title, opponent, game_group, team1_name, team1_code, team1_flag, team2_name, team2_code, team2_flag, round_name, match_date, match_time, status, brazil_score, opponent_score, prize_description, entry_fee_cents, currency, is_active)
      VALUES ($1::text, $2::text, $18::text, $12::text, NULLIF($13::text,''), NULLIF($14::text,''), $15::text, NULLIF($16::text,''), NULLIF($17::text,''), NULLIF($3::text,''), $4::date, $5::time, $6::text, $7::int, $8::int, $9::text, $10::int, 'BRL', $11::boolean)
      RETURNING *
    `, [payload.title, payload.opponent, payload.roundName || '', payload.matchDate, payload.matchTime, payload.status, payload.brazilScore, payload.opponentScore, payload.prizeDescription, payload.entryFeeCents, payload.isActive, payload.team1Name, payload.team1Code, payload.team1Flag, payload.team2Name, payload.team2Code, payload.team2Flag, payload.groupName]);
    if (payload.status === 'finished' && payload.brazilScore !== null && payload.opponentScore !== null) await evaluateGame(result.rows[0].id).catch(() => null);
    res.status(201).json({ ok: true, game: sanitizeGame(result.rows[0]), message: 'Jogo cadastrado no Bolão da Copa.' });
  } catch (error) { next(error); }
});

app.put('/api/bolao-copa/games/:id', requireAdmin, async (req, res, next) => {
  try {
    const payload = gamePayload(req.body || {});
    const result = await query(`
      UPDATE world_cup_games
      SET title=$2::text, opponent=$3::text, team1_name=$13::text, team1_code=NULLIF($14::text,''), team1_flag=NULLIF($15::text,''),
          team2_name=$16::text, team2_code=NULLIF($17::text,''), team2_flag=NULLIF($18::text,''), game_group=$19::text,
          round_name=NULLIF($4::text,''), match_date=$5::date, match_time=$6::time,
          status=$7::text, brazil_score=$8::int, opponent_score=$9::int, prize_description=$10::text, entry_fee_cents=$11::int,
          currency='BRL', is_active=$12::boolean, updated_at=NOW()
      WHERE id=$1::uuid AND deleted_at IS NULL
      RETURNING *
    `, [req.params.id, payload.title, payload.opponent, payload.roundName || '', payload.matchDate, payload.matchTime, payload.status, payload.brazilScore, payload.opponentScore, payload.prizeDescription, payload.entryFeeCents, payload.isActive, payload.team1Name, payload.team1Code, payload.team1Flag, payload.team2Name, payload.team2Code, payload.team2Flag, payload.groupName]);
    if (!result.rowCount) return res.status(404).json({ error: 'Jogo não encontrado.' });
    let evaluation = null;
    if (payload.status === 'finished' && payload.brazilScore !== null && payload.opponentScore !== null) evaluation = await evaluateGame(result.rows[0].id).catch(() => null);
    res.json({ ok: true, game: sanitizeGame(result.rows[0]), evaluation, message: 'Jogo atualizado.' });
  } catch (error) { next(error); }
});

app.delete('/api/bolao-copa/games/:id', requireAdmin, async (req, res, next) => {
  try {
    const result = await query('UPDATE world_cup_games SET deleted_at=NOW(), is_active=FALSE, updated_at=NOW() WHERE id=$1::uuid AND deleted_at IS NULL RETURNING id', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Jogo não encontrado.' });
    res.json({ ok: true, message: 'Jogo removido.' });
  } catch (error) { next(error); }
});

app.post('/api/bolao-copa/games/:id/evaluate', requireAdmin, async (req, res, next) => {
  try {
    const evaluation = await evaluateGame(req.params.id);
    res.json({ ok: true, evaluation, message: `${evaluation.winners || 0} ganhador(es) encontrado(s).` });
  } catch (error) { next(error); }
});

app.get('/api/bolao-copa/predictions', requireAdmin, async (req, res, next) => {
  try {
    const gameId = cleanText(req.query.gameId);
    const status = cleanText(req.query.status);
    const result = await query(`
      SELECT wp.*, t.name AS tutor_name, t.whatsapp AS tutor_whatsapp, t.email AS tutor_email,
             g.title AS game_title, g.opponent, g.game_group, g.team1_name, g.team1_code, g.team1_flag, g.team2_name, g.team2_code, g.team2_flag, g.match_date, g.match_time, g.prize_description, g.entry_fee_cents,
             pay.status AS payment_status, pay.method AS payment_method
      FROM world_cup_predictions wp
      INNER JOIN tutors t ON t.id = wp.tutor_id
      INNER JOIN world_cup_games g ON g.id = wp.game_id
      LEFT JOIN bolao_payments pay ON pay.id = wp.payment_id
      WHERE wp.deleted_at IS NULL
        AND (NULLIF($1::text, '') IS NULL OR wp.game_id = NULLIF($1::text, '')::uuid)
        AND (NULLIF($2::text, '') IS NULL OR wp.status = $2::text)
      ORDER BY wp.submitted_at DESC
      LIMIT 500
    `, [gameId, status]);
    res.json({ ok: true, predictions: result.rows.map(sanitizePrediction) });
  } catch (error) { next(error); }
});

app.get('/api/bolao-copa/payments', requireAdmin, async (req, res, next) => {
  try {
    const status = cleanText(req.query.status);
    const result = await query(`
      SELECT bp.*, t.name AS tutor_name, t.whatsapp AS tutor_whatsapp, t.email AS tutor_email,
             g.title AS game_title, g.opponent, g.game_group, g.team1_name, g.team1_code, g.team1_flag, g.team2_name, g.team2_code, g.team2_flag, g.match_date, g.match_time
      FROM bolao_payments bp
      INNER JOIN tutors t ON t.id = bp.tutor_id
      INNER JOIN world_cup_games g ON g.id = bp.game_id
      WHERE bp.deleted_at IS NULL
        AND (NULLIF($1::text, '') IS NULL OR bp.status = $1::text)
      ORDER BY bp.created_at DESC
      LIMIT 500
    `, [status]);
    res.json({ ok: true, payments: result.rows.map((row) => ({
      ...sanitizePayment(row),
      tutorName: row.tutor_name,
      tutorWhatsapp: row.tutor_whatsapp,
      tutorEmail: row.tutor_email,
      gameTitle: row.game_title || gameLabel(row),
      team1Name: gameTeam1(row),
      team1Code: row.team1_code || '',
      team1Flag: row.team1_flag || '',
      team2Name: gameTeam2(row),
      team2Code: row.team2_code || '',
      team2Flag: row.team2_flag || '',
      opponent: gameTeam2(row),
      matchDate: toIsoDate(row.match_date),
      matchTime: toTime(row.match_time)
    })) });
  } catch (error) { next(error); }
});


app.get('/api/bolao-copa/users', requireAdmin, async (_req, res, next) => {
  try {
    const result = await query(`
      SELECT t.*,
             COALESCE(pay.approved_payments_count, 0)::int AS approved_payments_count,
             COALESCE(pay.pending_payments_count, 0)::int AS pending_payments_count,
             COALESCE(pay.approved_amount_cents, 0)::int AS approved_amount_cents,
             COALESCE(pred.predictions_count, 0)::int AS predictions_count,
             COALESCE(pred.correct_predictions_count, 0)::int AS correct_predictions_count
      FROM tutors t
      LEFT JOIN LATERAL (
        SELECT COUNT(bp.id) FILTER (WHERE bp.status='approved')::int AS approved_payments_count,
               COUNT(bp.id) FILTER (WHERE bp.status='pending')::int AS pending_payments_count,
               COALESCE(SUM(bp.amount_cents) FILTER (WHERE bp.status='approved'), 0)::int AS approved_amount_cents
        FROM bolao_payments bp
        WHERE bp.tutor_id = t.id AND bp.deleted_at IS NULL
      ) pay ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(wp.id)::int AS predictions_count,
               COUNT(wp.id) FILTER (WHERE wp.status IN ('correct','awarded'))::int AS correct_predictions_count
        FROM world_cup_predictions wp
        WHERE wp.tutor_id = t.id AND wp.deleted_at IS NULL
      ) pred ON TRUE
      WHERE t.deleted_at IS NULL
      ORDER BY t.created_at DESC
      LIMIT 1000
    `);
    res.json({ ok: true, users: result.rows.map(sanitizeAdminUser) });
  } catch (error) { next(error); }
});

app.get('/api/bolao-copa/standings', requireAdmin, async (_req, res, next) => {
  try {
    const result = await query(`
      SELECT id, game_group, status, team1_name, team1_code, team1_flag, team2_name, team2_code, team2_flag, opponent, brazil_score, opponent_score, match_date, match_time
      FROM world_cup_games
      WHERE deleted_at IS NULL
        AND is_active = TRUE
      ORDER BY game_group ASC, match_date ASC, match_time ASC
    `);
    const table = buildWorldCupTable(result.rows);
    res.json({ ok: true, groups: table.groups, knockout: table.knockout, updatedAt: table.updatedAt });
  } catch (error) { next(error); }
});

app.patch('/api/bolao-copa/payments/:id/approve', requireAdmin, async (req, res, next) => {
  try {
    const result = await query(`
      UPDATE bolao_payments
      SET status='approved', method=COALESCE(NULLIF(method,''), 'manual'), provider=COALESCE(NULLIF(provider,''), 'manual'), updated_at=NOW()
      WHERE id=$1::uuid AND deleted_at IS NULL
      RETURNING *
    `, [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Pagamento não encontrado.' });
    res.json({ ok: true, payment: sanitizePayment(result.rows[0]), message: 'Pagamento marcado como aprovado.' });
  } catch (error) { next(error); }
});

app.patch('/api/bolao-copa/predictions/:id/award', requireAdmin, async (req, res, next) => {
  try {
    const result = await query(`
      UPDATE world_cup_predictions
      SET status='awarded', redeemed_at=NOW(), updated_at=NOW(), award_description=COALESCE(NULLIF($2::text,''), award_description, $3::text)
      WHERE id=$1::uuid AND deleted_at IS NULL AND status IN ('correct','awarded')
      RETURNING *
    `, [req.params.id, cleanText(req.body?.awardDescription), DEFAULT_PRIZE]);
    if (!result.rowCount) return res.status(404).json({ error: 'Palpite premiado não encontrado.' });
    res.json({ ok: true, prediction: sanitizePrediction(result.rows[0]), message: 'Prêmio marcado como entregue.' });
  } catch (error) { next(error); }
});

app.get('/api/app/public/today-games', async (_req, res, next) => {
  try {
    await closeGamesForPredictionDeadline();
    const result = await query(`
      SELECT g.*,
             ((g.match_date + COALESCE(g.match_time, TIME '16:00')) > ((NOW() AT TIME ZONE 'America/Sao_Paulo') + ($1::int * INTERVAL '1 minute')) AND g.status IN ('scheduled','open')) AS is_open,
             COALESCE(stats.accumulated_cents, 0)::int AS accumulated_cents,
             COALESCE(stats.participants_count, 0)::int AS participants_count
      FROM world_cup_games g
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(bp.amount_cents) FILTER (WHERE bp.status='approved'), 0)::int AS accumulated_cents,
               COUNT(bp.id) FILTER (WHERE bp.status='approved')::int AS participants_count
        FROM bolao_payments bp
        WHERE bp.game_id = g.id AND bp.deleted_at IS NULL
      ) stats ON TRUE
      WHERE g.deleted_at IS NULL
        AND g.is_active = TRUE
        AND g.status <> 'canceled'
        AND g.match_date = (NOW() AT TIME ZONE 'America/Sao_Paulo')::date
      ORDER BY g.match_time ASC, g.created_at DESC
      LIMIT 8
    `, [PREDICTION_CLOSE_MINUTES]);
    res.json({ ok: true, games: result.rows.map(sanitizeGame), date: toIsoDate(new Date()) });
  } catch (error) { next(error); }
});

app.get('/api/app/bolao-copa', requireTutor, async (req, res, next) => {
  try {
    res.json(await getTutorBolaoPayload(req.tutor.id));
  } catch (error) { next(error); }
});

app.get('/api/app/bolao-copa/:gameId/predictions', requireTutor, async (req, res, next) => {
  try {
    const gameResult = await query(`
      SELECT g.*,
             COALESCE(stats.accumulated_cents, 0)::int AS accumulated_cents,
             COALESCE(stats.participants_count, 0)::int AS participants_count
      FROM world_cup_games g
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(bp.amount_cents) FILTER (WHERE bp.status='approved'), 0)::int AS accumulated_cents,
               COUNT(bp.id) FILTER (WHERE bp.status='approved')::int AS participants_count
        FROM bolao_payments bp
        WHERE bp.game_id = g.id AND bp.deleted_at IS NULL
      ) stats ON TRUE
      WHERE g.id=$1::uuid AND g.deleted_at IS NULL AND g.is_active=TRUE
      LIMIT 1
    `, [req.params.gameId]);
    if (!gameResult.rowCount) return res.status(404).json({ error: 'Jogo não encontrado.' });
    const gameRow = gameResult.rows[0];
    const predictionsResult = await query(`
      SELECT wp.*, t.name AS tutor_name, g.title AS game_title, g.opponent, g.game_group,
             g.team1_name, g.team1_code, g.team1_flag, g.team2_name, g.team2_code, g.team2_flag,
             g.match_date, g.match_time, g.prize_description, g.entry_fee_cents, g.brazil_score, g.opponent_score
      FROM world_cup_predictions wp
      INNER JOIN tutors t ON t.id = wp.tutor_id
      INNER JOIN world_cup_games g ON g.id = wp.game_id
      WHERE wp.game_id=$1::uuid AND wp.deleted_at IS NULL
      ORDER BY wp.submitted_at ASC, t.name ASC
      LIMIT 1000
    `, [req.params.gameId]);
    const rows = predictionsResult.rows || [];
    const winners = rows.filter(predictionWinnerFromGame);
    const accumulatedCents = Number(gameRow.accumulated_cents || 0);
    const platformFeeCents = Math.floor(accumulatedCents * 0.10);
    const payoutPoolCents = Math.max(0, accumulatedCents - platformFeeCents);
    const prizePerWinnerCents = winners.length ? Math.floor(payoutPoolCents / winners.length) : 0;
    const predictions = rows.map((row) => {
      const publicStatus = predictionPublicStatus(row);
      return {
        ...sanitizePrediction({ ...row, status: publicStatus }),
        tutorWhatsapp: undefined,
        tutorEmail: undefined,
        isWinner: publicStatus === 'correct' || publicStatus === 'awarded',
        prizeCents: (publicStatus === 'correct' || publicStatus === 'awarded') ? prizePerWinnerCents : 0,
        prizeAmount: centsToAmount((publicStatus === 'correct' || publicStatus === 'awarded') ? prizePerWinnerCents : 0)
      };
    });
    res.json({
      ok: true,
      game: sanitizeGame(gameRow),
      predictions,
      totalPredictions: predictions.length,
      winnersCount: winners.length,
      accumulatedCents,
      accumulatedAmount: centsToAmount(accumulatedCents),
      platformFeeCents,
      platformFeeAmount: centsToAmount(platformFeeCents),
      payoutPoolCents,
      payoutPoolAmount: centsToAmount(payoutPoolCents),
      prizePerWinnerCents,
      prizePerWinnerAmount: centsToAmount(prizePerWinnerCents)
    });
  } catch (error) { next(error); }
});

app.get('/api/app/bolao-copa/standings', requireTutor, async (_req, res, next) => {
  try {
    const result = await query(`
      SELECT id, game_group, status, team1_name, team1_code, team1_flag, team2_name, team2_code, team2_flag, opponent, brazil_score, opponent_score, match_date, match_time
      FROM world_cup_games
      WHERE deleted_at IS NULL
        AND is_active = TRUE
      ORDER BY game_group ASC, match_date ASC, match_time ASC
    `);
    const table = buildWorldCupTable(result.rows);
    res.json({ ok: true, groups: table.groups, knockout: table.knockout, updatedAt: table.updatedAt });
  } catch (error) { next(error); }
});

app.post('/api/app/bolao-copa/:gameId/payments/checkout', requireTutor, async (req, res, next) => {
  try {
    const game = await ensureGameCanReceivePayment(req.params.gameId);
    const payment = await createLocalPayment({ tutor: req.tutor, game, method: 'checkout_pro' });
    if (payment.status === 'approved') return res.json({ ok: true, payment: sanitizePayment(payment), bolao: await getTutorBolaoPayload(req.tutor.id), message: 'Pagamento já aprovado para este jogo.' });

    if (!MP_ACCESS_TOKEN && PAYMENT_DEMO_AUTOPAY) {
      const approved = await updatePaymentFromMpPayload({ localPaymentId: payment.id, status: 'approved', rawPayload: { demo: true, reason: 'PAYMENT_DEMO_AUTOPAY' } });
      return res.json({ ok: true, payment: sanitizePayment(approved), bolao: await getTutorBolaoPayload(req.tutor.id), message: 'Modo demonstração: pagamento aprovado automaticamente.' });
    }

    const amount = centsToAmount(game.entry_fee_cents);
    const backUrls = mercadoPagoBackUrls(game.id);
    const preferenceBody = {
      items: [{
        id: String(game.id),
        title: `Bolão PetFunny — ${gameLabel(game)}`,
        description: `${game.round_name || gameLabel(game) || 'Jogo da Copa'} · participação no bolão`,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: amount
      }],
      payer: mpPayer(req.tutor),
      external_reference: `bolao:${payment.id}`,
      back_urls: backUrls,
      payment_methods: {
        installments: 1
      },
      metadata: {
        local_payment_id: payment.id,
        game_id: game.id,
        tutor_id: req.tutor.id,
        product: 'bolao_copa_petfunny'
      }
    };

    const notificationUrl = mercadoPagoNotificationUrl();
    if (notificationUrl) preferenceBody.notification_url = notificationUrl;

    if (shouldEnableMercadoPagoAutoReturn(backUrls.success)) {
      preferenceBody.auto_return = 'approved';
    }

    const preference = await mercadoPagoRequest('/checkout/preferences', {
      method: 'POST',
      body: preferenceBody
    });

    const checkoutUrl = preference.init_point || preference.sandbox_init_point || '';
    const updated = await query(`
      UPDATE bolao_payments
      SET preference_id=$2::text, checkout_url=$3::text, raw_payload=$4::jsonb, updated_at=NOW()
      WHERE id=$1::uuid
      RETURNING *
    `, [payment.id, cleanText(preference.id), checkoutUrl, JSON.stringify(preference)]);

    res.json({ ok: true, payment: sanitizePayment(updated.rows[0]), checkoutUrl, preferenceId: preference.id, message: 'Checkout Mercado Pago criado.' });
  } catch (error) { next(error); }
});

app.post('/api/app/bolao-copa/:gameId/payments/pix', requireTutor, async (req, res, next) => {
  try {
    const game = await ensureGameCanReceivePayment(req.params.gameId);
    const payment = await createLocalPayment({ tutor: req.tutor, game, method: 'pix' });
    if (payment.status === 'approved') return res.json({ ok: true, payment: sanitizePayment(payment), bolao: await getTutorBolaoPayload(req.tutor.id), message: 'Pagamento já aprovado para este jogo.' });

    if (!MP_ACCESS_TOKEN && PAYMENT_DEMO_AUTOPAY) {
      const approved = await updatePaymentFromMpPayload({ localPaymentId: payment.id, status: 'approved', rawPayload: { demo: true, reason: 'PAYMENT_DEMO_AUTOPAY' } });
      return res.json({ ok: true, payment: sanitizePayment(approved), bolao: await getTutorBolaoPayload(req.tutor.id), message: 'Modo demonstração: Pix aprovado automaticamente.' });
    }

    const pixBody = {
      transaction_amount: centsToAmount(game.entry_fee_cents),
      description: `Bolão PetFunny — ${gameLabel(game)}`,
      payment_method_id: 'pix',
      payer: mpPayer(req.tutor, 'payment'),
      external_reference: `bolao:${payment.id}`,
      metadata: {
        local_payment_id: payment.id,
        game_id: game.id,
        tutor_id: req.tutor.id,
        product: 'bolao_copa_petfunny'
      }
    };

    const notificationUrl = mercadoPagoNotificationUrl();
    if (notificationUrl) pixBody.notification_url = notificationUrl;

    const pix = await mercadoPagoRequest('/v1/payments', {
      method: 'POST',
      idempotencyKey: `bolao-pix-${payment.id}`,
      body: pixBody
    });

    const transactionData = pix?.point_of_interaction?.transaction_data || {};
    const updated = await updatePaymentFromMpPayload({
      localPaymentId: payment.id,
      mercadoPagoPaymentId: pix.id,
      status: pix.status,
      rawPayload: pix,
      extra: {
        checkoutUrl: transactionData.ticket_url,
        pixQrCode: transactionData.qr_code,
        pixQrCodeBase64: transactionData.qr_code_base64
      }
    });
    res.json({ ok: true, payment: sanitizePayment(updated), message: 'Pix gerado. Pague pelo QR Code ou copia e cola.' });
  } catch (error) { next(error); }
});

app.get('/api/app/bolao-copa/:gameId/payment/status', requireTutor, async (req, res, next) => {
  try {
    const result = await query(`
      SELECT * FROM bolao_payments
      WHERE tutor_id=$1::uuid AND game_id=$2::uuid AND deleted_at IS NULL
      ORDER BY CASE WHEN status='approved' THEN 0 WHEN status='pending' THEN 1 ELSE 2 END, created_at DESC
      LIMIT 1
    `, [req.tutor.id, req.params.gameId]);
    const payment = result.rows[0];
    if (!payment) return res.json({ ok: true, payment: null, bolao: await getTutorBolaoPayload(req.tutor.id) });
    res.json({ ok: true, payment: sanitizePayment(payment), bolao: await getTutorBolaoPayload(req.tutor.id) });
  } catch (error) { next(error); }
});

app.post('/api/app/bolao-copa/:gameId/prediction', requireTutor, async (req, res, next) => {
  try {
    const tutorId = req.tutor.id;
    const gameId = req.params.gameId;
    const brazil = normalizeScore(req.body?.team1Score ?? req.body?.team1_score ?? req.body?.brazilScore ?? req.body?.brazil_score);
    const opponent = normalizeScore(req.body?.team2Score ?? req.body?.team2_score ?? req.body?.opponentScore ?? req.body?.opponent_score);
    if (brazil === null || opponent === null) return res.status(400).json({ error: 'Informe o placar completo do palpite.' });
    await closeGamesForPredictionDeadline();
    const gameResult = await query(`
      SELECT *, ((match_date + COALESCE(match_time, TIME '16:00')) > ((NOW() AT TIME ZONE 'America/Sao_Paulo') + ($2::int * INTERVAL '1 minute')) AND status IN ('scheduled','open')) AS is_open
      FROM world_cup_games
      WHERE id=$1::uuid AND deleted_at IS NULL AND is_active = TRUE
    `, [gameId, PREDICTION_CLOSE_MINUTES]);
    const game = gameResult.rows[0];
    if (!game) return res.status(404).json({ error: 'Jogo do Bolão da Copa não encontrado.' });
    if (!game.is_open) return res.status(400).json({ error: 'Palpites encerrados para este jogo.' });
    const existing = await query('SELECT id FROM world_cup_predictions WHERE game_id=$1::uuid AND tutor_id=$2::uuid AND deleted_at IS NULL', [gameId, tutorId]);
    if (existing.rows[0]) return res.status(409).json({ error: 'Você já enviou 1 palpite para este jogo. O palpite fica registrado e não pode ser alterado pelo app.' });

    let paymentId = null;
    if (Number(game.entry_fee_cents || 0) > 0) {
      const payment = await query(`
        SELECT * FROM bolao_payments
        WHERE game_id=$1::uuid AND tutor_id=$2::uuid AND status='approved' AND deleted_at IS NULL
        ORDER BY updated_at DESC
        LIMIT 1
      `, [gameId, tutorId]);
      if (!payment.rows[0]) return res.status(402).json({ error: 'Para participar deste bolão, primeiro conclua o pagamento do jogo.' });
      paymentId = payment.rows[0].id;
    }

    const result = await query(`
      INSERT INTO world_cup_predictions (game_id, tutor_id, payment_id, predicted_brazil_score, predicted_opponent_score, status)
      VALUES ($1::uuid, $2::uuid, $3::uuid, $4::int, $5::int, 'pending')
      RETURNING *
    `, [gameId, tutorId, paymentId, brazil, opponent]);
    res.status(201).json({ ok: true, prediction: sanitizePrediction({ ...result.rows[0], ...game }), bolao: await getTutorBolaoPayload(tutorId), message: 'Palpite registrado. Boa sorte no Bolão PetFunny!' });
  } catch (error) { next(error); }
});

async function syncMercadoPagoPaymentById(mercadoPagoPaymentId) {
  const mpPayment = await mercadoPagoRequest(`/v1/payments/${encodeURIComponent(mercadoPagoPaymentId)}`);
  let localPaymentId = localPaymentIdFromExternalReference(mpPayment.external_reference);
  if (!localPaymentId && mpPayment?.metadata?.local_payment_id) localPaymentId = mpPayment.metadata.local_payment_id;
  if (!localPaymentId) {
    const existing = await query('SELECT id FROM bolao_payments WHERE mercado_pago_payment_id=$1::text AND deleted_at IS NULL LIMIT 1', [String(mercadoPagoPaymentId)]);
    localPaymentId = existing.rows[0]?.id || '';
  }
  if (!localPaymentId) return null;
  return updatePaymentFromMpPayload({ localPaymentId, mercadoPagoPaymentId: mpPayment.id, status: mpPayment.status, rawPayload: mpPayment });
}

app.post('/api/payments/mercado-pago/webhook', async (req, res) => {
  try {
    const type = cleanText(req.body?.type || req.query?.type || req.body?.topic || req.query?.topic);
    const paymentId = cleanText(req.body?.data?.id || req.query?.['data.id'] || req.query?.id || req.body?.id);
    if ((type === 'payment' || type === 'payment.created' || !type) && paymentId) {
      await syncMercadoPagoPaymentById(paymentId);
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('[mercado-pago:webhook:error]', error);
    res.sendStatus(200);
  }
});

app.get('/api/payments/mercado-pago/webhook', (_req, res) => res.json({ ok: true, service: 'mercado-pago-webhook' }));

app.get('/manifest.webmanifest', (_req, res) => {
  res.json({
    name: process.env.APP_NAME || 'Bolão da Copa PetFunny',
    short_name: 'Bolão PetFunny',
    start_url: '/app',
    display: 'standalone',
    background_color: '#f8f7ff',
    theme_color: '#01ADB7',
    icons: [
      { src: '/assets/img/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/assets/img/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ]
  });
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Rota não encontrada.' });
  res.redirect('/app');
});

app.use((error, _req, res, _next) => {
  console.error('[api:error]', error);
  res.status(error.status || 500).json({ error: error.message || 'Erro interno.' });
});

export default app;
