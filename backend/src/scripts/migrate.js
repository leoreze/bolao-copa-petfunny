import { query, closePool, printDatabaseErrorHelp } from '../db.js';


const WORLD_CUP_TEAMS = [
  { code: 'MEX', name: 'México', flag: '/assets/img/flags/MEX.png', groupName: 'Grupo A' },
  { code: 'RSA', name: 'África do Sul', flag: '/assets/img/flags/RSA.png', groupName: 'Grupo A' },
  { code: 'KOR', name: 'Coreia do Sul', flag: '/assets/img/flags/KOR.png', groupName: 'Grupo A' },
  { code: 'CZE', name: 'Tchéquia', flag: '/assets/img/flags/CZE.png', groupName: 'Grupo A' },
  { code: 'CAN', name: 'Canadá', flag: '/assets/img/flags/CAN.png', groupName: 'Grupo B' },
  { code: 'BIH', name: 'Bósnia e Herzegovina', flag: '/assets/img/flags/BIH.png', groupName: 'Grupo B' },
  { code: 'QAT', name: 'Catar', flag: '/assets/img/flags/QAT.png', groupName: 'Grupo B' },
  { code: 'SUI', name: 'Suíça', flag: '/assets/img/flags/SUI.png', groupName: 'Grupo B' },
  { code: 'BRA', name: 'Brasil', flag: '/assets/img/flags/BRA.png', groupName: 'Grupo C' },
  { code: 'MAR', name: 'Marrocos', flag: '/assets/img/flags/MAR.png', groupName: 'Grupo C' },
  { code: 'HAI', name: 'Haiti', flag: '/assets/img/flags/HAI.png', groupName: 'Grupo C' },
  { code: 'SCO', name: 'Escócia', flag: '/assets/img/flags/SCO.png', groupName: 'Grupo C' },
  { code: 'USA', name: 'Estados Unidos', flag: '/assets/img/flags/USA.png', groupName: 'Grupo D' },
  { code: 'PAR', name: 'Paraguai', flag: '/assets/img/flags/PAR.png', groupName: 'Grupo D' },
  { code: 'AUS', name: 'Austrália', flag: '/assets/img/flags/AUS.png', groupName: 'Grupo D' },
  { code: 'TUR', name: 'Turquia', flag: '/assets/img/flags/TUR.png', groupName: 'Grupo D' },
  { code: 'GER', name: 'Alemanha', flag: '/assets/img/flags/GER.png', groupName: 'Grupo E' },
  { code: 'CUW', name: 'Curaçao', flag: '/assets/img/flags/CUW.png', groupName: 'Grupo E' },
  { code: 'CIV', name: 'Costa do Marfim', flag: '/assets/img/flags/CIV.png', groupName: 'Grupo E' },
  { code: 'ECU', name: 'Equador', flag: '/assets/img/flags/ECU.png', groupName: 'Grupo E' },
  { code: 'NED', name: 'Holanda', flag: '/assets/img/flags/NED.png', groupName: 'Grupo F' },
  { code: 'JPN', name: 'Japão', flag: '/assets/img/flags/JPN.png', groupName: 'Grupo F' },
  { code: 'SWE', name: 'Suécia', flag: '/assets/img/flags/SWE.png', groupName: 'Grupo F' },
  { code: 'TUN', name: 'Tunísia', flag: '/assets/img/flags/TUN.png', groupName: 'Grupo F' },
  { code: 'BEL', name: 'Bélgica', flag: '/assets/img/flags/BEL.png', groupName: 'Grupo G' },
  { code: 'EGY', name: 'Egito', flag: '/assets/img/flags/EGY.png', groupName: 'Grupo G' },
  { code: 'IRN', name: 'Irã', flag: '/assets/img/flags/IRN.png', groupName: 'Grupo G' },
  { code: 'NZL', name: 'Nova Zelândia', flag: '/assets/img/flags/NZL.png', groupName: 'Grupo G' },
  { code: 'ESP', name: 'Espanha', flag: '/assets/img/flags/ESP.png', groupName: 'Grupo H' },
  { code: 'CPV', name: 'Cabo Verde', flag: '/assets/img/flags/CPV.png', groupName: 'Grupo H' },
  { code: 'KSA', name: 'Arábia Saudita', flag: '/assets/img/flags/KSA.png', groupName: 'Grupo H' },
  { code: 'URU', name: 'Uruguai', flag: '/assets/img/flags/URU.png', groupName: 'Grupo H' },
  { code: 'FRA', name: 'França', flag: '/assets/img/flags/FRA.png', groupName: 'Grupo I' },
  { code: 'SEN', name: 'Senegal', flag: '/assets/img/flags/SEN.png', groupName: 'Grupo I' },
  { code: 'IRQ', name: 'Iraque', flag: '/assets/img/flags/IRQ.png', groupName: 'Grupo I' },
  { code: 'NOR', name: 'Noruega', flag: '/assets/img/flags/NOR.png', groupName: 'Grupo I' },
  { code: 'ARG', name: 'Argentina', flag: '/assets/img/flags/ARG.png', groupName: 'Grupo J' },
  { code: 'ALG', name: 'Argélia', flag: '/assets/img/flags/ALG.png', groupName: 'Grupo J' },
  { code: 'AUT', name: 'Áustria', flag: '/assets/img/flags/AUT.png', groupName: 'Grupo J' },
  { code: 'JOR', name: 'Jordânia', flag: '/assets/img/flags/JOR.png', groupName: 'Grupo J' },
  { code: 'POR', name: 'Portugal', flag: '/assets/img/flags/POR.png', groupName: 'Grupo K' },
  { code: 'COD', name: 'RD Congo', flag: '/assets/img/flags/COD.png', groupName: 'Grupo K' },
  { code: 'UZB', name: 'Uzbequistão', flag: '/assets/img/flags/UZB.png', groupName: 'Grupo K' },
  { code: 'COL', name: 'Colômbia', flag: '/assets/img/flags/COL.png', groupName: 'Grupo K' },
  { code: 'ENG', name: 'Inglaterra', flag: '/assets/img/flags/ENG.png', groupName: 'Grupo L' },
  { code: 'CRO', name: 'Croácia', flag: '/assets/img/flags/CRO.png', groupName: 'Grupo L' },
  { code: 'GHA', name: 'Gana', flag: '/assets/img/flags/GHA.png', groupName: 'Grupo L' },
  { code: 'PAN', name: 'Panamá', flag: '/assets/img/flags/PAN.png', groupName: 'Grupo L' }
];

async function backfillWorldCupTeams() {
  for (const team of WORLD_CUP_TEAMS) {
    await query(`
      UPDATE world_cup_games
      SET team1_code = COALESCE(NULLIF(team1_code,''), $1),
          team1_flag = $2,
          team1_name = $3,
          updated_at = NOW()
      WHERE deleted_at IS NULL
        AND (LOWER(team1_name) = LOWER($3) OR LOWER(team1_code) = LOWER($1))
    `, [team.code, team.flag, team.name]);
    await query(`
      UPDATE world_cup_games
      SET team2_code = COALESCE(NULLIF(team2_code,''), $1),
          team2_flag = $2,
          team2_name = $3,
          opponent = $3,
          updated_at = NOW()
      WHERE deleted_at IS NULL
        AND (LOWER(team2_name) = LOWER($3) OR LOWER(opponent) = LOWER($3) OR LOWER(team2_code) = LOWER($1))
    `, [team.code, team.flag, team.name]);
  }

  for (const groupName of [...new Set(WORLD_CUP_TEAMS.map((team) => team.groupName))]) {
    const codes = WORLD_CUP_TEAMS.filter((team) => team.groupName === groupName).map((team) => team.code);
    await query(`
      UPDATE world_cup_games
      SET game_group = $1,
          updated_at = NOW()
      WHERE deleted_at IS NULL
        AND team1_code = ANY($2::text[])
        AND team2_code = ANY($2::text[])
    `, [groupName, codes]);
  }
}


const statements = [
  `CREATE EXTENSION IF NOT EXISTS pgcrypto`,

  `CREATE TABLE IF NOT EXISTS tutors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'Participante PetFunny',
    whatsapp TEXT NOT NULL UNIQUE,
    email TEXT,
    password_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
  )`,
  `ALTER TABLE tutors ADD COLUMN IF NOT EXISTS password_hash TEXT`,
  `ALTER TABLE tutors ADD COLUMN IF NOT EXISTS email TEXT`,
  `ALTER TABLE tutors ADD COLUMN IF NOT EXISTS reset_password_token_hash TEXT`,
  `ALTER TABLE tutors ADD COLUMN IF NOT EXISTS reset_password_expires_at TIMESTAMPTZ`,
  `ALTER TABLE tutors ADD COLUMN IF NOT EXISTS pix_key_type TEXT`,
  `ALTER TABLE tutors ADD COLUMN IF NOT EXISTS pix_key TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_tutors_email_unique ON tutors (LOWER(email)) WHERE email IS NOT NULL AND email <> '' AND deleted_at IS NULL`,

  `CREATE TABLE IF NOT EXISTS world_cup_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'Brasil na Copa',
    opponent TEXT NOT NULL DEFAULT 'Adversário',
    round_name TEXT,
    match_date DATE NOT NULL,
    match_time TIME NOT NULL DEFAULT '16:00',
    status TEXT NOT NULL DEFAULT 'scheduled',
    brazil_score INTEGER,
    opponent_score INTEGER,
    prize_description TEXT NOT NULL DEFAULT 'Banho grátis PetFunny',
    entry_fee_cents INTEGER NOT NULL DEFAULT 1000,
    currency TEXT NOT NULL DEFAULT 'BRL',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
  )`,
  `ALTER TABLE world_cup_games ADD COLUMN IF NOT EXISTS entry_fee_cents INTEGER NOT NULL DEFAULT 1000`,
  `ALTER TABLE world_cup_games ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'BRL'`,
  `ALTER TABLE world_cup_games ADD COLUMN IF NOT EXISTS game_group TEXT NOT NULL DEFAULT 'Grupo A'`,
  `ALTER TABLE world_cup_games ADD COLUMN IF NOT EXISTS team1_name TEXT NOT NULL DEFAULT 'Brasil'`,
  `ALTER TABLE world_cup_games ADD COLUMN IF NOT EXISTS team1_code TEXT`,
  `ALTER TABLE world_cup_games ADD COLUMN IF NOT EXISTS team1_flag TEXT`,
  `ALTER TABLE world_cup_games ADD COLUMN IF NOT EXISTS team2_name TEXT`,
  `ALTER TABLE world_cup_games ADD COLUMN IF NOT EXISTS team2_code TEXT`,
  `ALTER TABLE world_cup_games ADD COLUMN IF NOT EXISTS team2_flag TEXT`,
  `UPDATE world_cup_games SET game_group=COALESCE(NULLIF(game_group,''),'Grupo A'), team1_name=COALESCE(NULLIF(team1_name,''),'Brasil'), team2_name=COALESCE(NULLIF(team2_name,''), opponent) WHERE deleted_at IS NULL`,

  `CREATE TABLE IF NOT EXISTS bolao_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES world_cup_games(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'BRL',
    status TEXT NOT NULL DEFAULT 'pending',
    method TEXT NOT NULL DEFAULT 'checkout_pro',
    provider TEXT NOT NULL DEFAULT 'mercado_pago',
    preference_id TEXT,
    mercado_pago_payment_id TEXT,
    checkout_url TEXT,
    pix_qr_code TEXT,
    pix_qr_code_base64 TEXT,
    expires_at TIMESTAMPTZ,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
  )`,

  `CREATE TABLE IF NOT EXISTS world_cup_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES world_cup_games(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES bolao_payments(id) ON DELETE SET NULL,
    predicted_brazil_score INTEGER NOT NULL DEFAULT 0,
    predicted_opponent_score INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    award_description TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    evaluated_at TIMESTAMPTZ,
    redeemed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
  )`,
  `ALTER TABLE world_cup_predictions ADD COLUMN IF NOT EXISTS payment_id UUID`,
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'world_cup_predictions_payment_id_fkey'
     ) THEN
       ALTER TABLE world_cup_predictions
       ADD CONSTRAINT world_cup_predictions_payment_id_fkey
       FOREIGN KEY (payment_id) REFERENCES bolao_payments(id) ON DELETE SET NULL;
     END IF;
   END $$`,

  `CREATE UNIQUE INDEX IF NOT EXISTS idx_world_cup_predictions_game_tutor_unique ON world_cup_predictions (game_id, tutor_id) WHERE deleted_at IS NULL`,
  `CREATE INDEX IF NOT EXISTS idx_world_cup_games_active ON world_cup_games (is_active, status, match_date, match_time) WHERE deleted_at IS NULL`,
  `CREATE INDEX IF NOT EXISTS idx_world_cup_games_group ON world_cup_games (game_group, match_date, match_time) WHERE deleted_at IS NULL`,
  `CREATE INDEX IF NOT EXISTS idx_world_cup_predictions_game ON world_cup_predictions (game_id, status) WHERE deleted_at IS NULL`,
  `CREATE INDEX IF NOT EXISTS idx_world_cup_predictions_tutor ON world_cup_predictions (tutor_id, submitted_at DESC) WHERE deleted_at IS NULL`,
  `CREATE INDEX IF NOT EXISTS idx_bolao_payments_tutor_game ON bolao_payments (tutor_id, game_id, status, created_at DESC) WHERE deleted_at IS NULL`,
  `CREATE INDEX IF NOT EXISTS idx_bolao_payments_game_status ON bolao_payments (game_id, status) WHERE deleted_at IS NULL`,
  `CREATE INDEX IF NOT EXISTS idx_bolao_payments_mp_payment_id ON bolao_payments (mercado_pago_payment_id) WHERE mercado_pago_payment_id IS NOT NULL AND deleted_at IS NULL`,
  `CREATE INDEX IF NOT EXISTS idx_bolao_payments_preference_id ON bolao_payments (preference_id) WHERE preference_id IS NOT NULL AND deleted_at IS NULL`,

  `CREATE TABLE IF NOT EXISTS prize_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES world_cup_games(id) ON DELETE CASCADE,
    prediction_id UUID NOT NULL REFERENCES world_cup_predictions(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    platform_fee_cents INTEGER NOT NULL DEFAULT 0,
    accumulated_cents INTEGER NOT NULL DEFAULT 0,
    winners_count INTEGER NOT NULL DEFAULT 1,
    pix_key_type TEXT NOT NULL DEFAULT 'cpf',
    pix_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
  )`,
  `ALTER TABLE prize_redemptions ADD COLUMN IF NOT EXISTS platform_fee_cents INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE prize_redemptions ADD COLUMN IF NOT EXISTS accumulated_cents INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE prize_redemptions ADD COLUMN IF NOT EXISTS winners_count INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE prize_redemptions ADD COLUMN IF NOT EXISTS admin_notes TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_prize_redemptions_prediction_unique ON prize_redemptions (prediction_id) WHERE deleted_at IS NULL`,
  `CREATE INDEX IF NOT EXISTS idx_prize_redemptions_tutor ON prize_redemptions (tutor_id, status, created_at DESC) WHERE deleted_at IS NULL`,
  `CREATE INDEX IF NOT EXISTS idx_prize_redemptions_game ON prize_redemptions (game_id, status, created_at DESC) WHERE deleted_at IS NULL`
];

async function migrate() {
  try {
    for (const statement of statements) await query(statement);
    await backfillWorldCupTeams();
    console.log('[migrate] Banco do Bolão da Copa pronto com login, recuperação de senha, seleções, grupos, bandeiras, pagamentos Mercado Pago, regras e resgates Pix.');
  } finally {
    await closePool();
  }
}

migrate().catch(async (error) => {
  printDatabaseErrorHelp(error, 'migrate');
  console.error('[migrate:error]', error.message || error);
  await closePool().catch(() => null);
  process.exit(1);
});
