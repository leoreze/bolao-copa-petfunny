import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');
const projectRoot = path.resolve(backendDir, '..');

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(backendDir, '.env'),
  path.resolve(projectRoot, '.env')
];
const uniqueEnvCandidates = [...new Set(envCandidates)];

for (const envPath of uniqueEnvCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

let pool;

export function getDatabaseUrl() {
  return process.env.DATABASE_URL || '';
}

export function assertDatabaseConfig() {
  if (!getDatabaseUrl()) {
    const locations = uniqueEnvCandidates.map((item) => `- ${item}`).join('\n');
    throw new Error(
      `DATABASE_URL não configurada.\n\n` +
      `Crie um arquivo .env na raiz do projeto ou em backend/.env usando o modelo .env.example.\n\n` +
      `Exemplo local:\n` +
      `DATABASE_URL=postgres://postgres:postgres@localhost:5432/bolao_copa_petfunny\n\n` +
      `Locais verificados:\n${locations}`
    );
  }
}

function shouldUseSsl(connectionString) {
  const configured = String(process.env.DATABASE_SSL || 'auto').trim().toLowerCase();

  if (configured === 'true' || configured === '1' || configured === 'require') return true;
  if (configured === 'false' || configured === '0' || configured === 'disable') return false;

  try {
    const url = new URL(connectionString);
    const hostname = url.hostname.toLowerCase();
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    const isRender = Boolean(process.env.RENDER) || hostname.includes('render.com') || hostname.startsWith('dpg-');
    const requiresSslByUrl = url.searchParams.get('sslmode') === 'require';

    return requiresSslByUrl || (!isLocal && isRender);
  } catch {
    return process.env.NODE_ENV === 'production';
  }
}

export function getPool() {
  assertDatabaseConfig();

  if (!pool) {
    const connectionString = getDatabaseUrl();
    pool = new Pool({
      connectionString,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined
    });
  }

  return pool;
}

export function query(text, params = []) {
  return getPool().query(text, params);
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

export function printDatabaseErrorHelp(error, context = 'db') {
  if (!error) return;

  if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
    console.error(`\n[${context}] PostgreSQL não respondeu no endereço configurado.`);
    console.error('Soluções rápidas:');
    console.error('1. Se for banco local, inicie o PostgreSQL ou rode: docker compose up -d postgres;');
    console.error('2. Se for Render, use a External Database URL no .env local;');
    console.error('3. Se o app estiver hospedado no Render, configure DATABASE_URL nas Environment Variables do Web Service.\n');
  }

  if (error.message?.includes('no pg_hba.conf') || error.message?.toLowerCase().includes('ssl')) {
    console.error(`\n[${context}] A conexão com PostgreSQL parece exigir SSL.`);
    console.error('Para Render, configure DATABASE_SSL=true ou deixe DATABASE_SSL=auto.\n');
  }

  if (error.message?.includes('DATABASE_URL não configurada')) {
    console.error(`\n[${context}] DATABASE_URL não configurada.`);
    console.error('Crie o .env com: copy .env.example .env');
    console.error('Depois rode novamente: npm run db:migrate\n');
  }
}
