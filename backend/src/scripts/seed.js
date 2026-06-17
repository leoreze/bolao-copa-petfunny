import bcrypt from 'bcryptjs';
import { query, closePool, printDatabaseErrorHelp } from '../db.js';


async function seed() {
  try {
    const count = await query(`SELECT COUNT(*)::int AS total FROM world_cup_games WHERE deleted_at IS NULL`);
    if (Number(count.rows[0]?.total || 0) === 0) {
      await query(`
        INSERT INTO world_cup_games (title, opponent, game_group, team1_name, team1_code, team1_flag, team2_name, team2_code, team2_flag, round_name, match_date, match_time, status, prize_description, entry_fee_cents, currency, is_active)
        VALUES
        ('México x África do Sul', 'África do Sul', 'Grupo A', 'México', 'MEX', '🇲🇽', 'África do Sul', 'RSA', '🇿🇦', 'Fase de grupos', CURRENT_DATE + INTERVAL '7 days', '16:00', 'open', 'Banho grátis PetFunny', 1000, 'BRL', TRUE),
        ('Brasil x Marrocos', 'Marrocos', 'Grupo C', 'Brasil', 'BRA', '🇧🇷', 'Marrocos', 'MAR', '🇲🇦', 'Fase de grupos', CURRENT_DATE + INTERVAL '12 days', '13:00', 'open', 'Banho grátis PetFunny + bandana', 1500, 'BRL', TRUE),
        ('Argentina x Argélia', 'Argélia', 'Grupo J', 'Argentina', 'ARG', '🇦🇷', 'Argélia', 'ALG', '🇩🇿', 'Fase de grupos', CURRENT_DATE + INTERVAL '17 days', '16:00', 'scheduled', 'Banho premium PetFunny', 2000, 'BRL', TRUE)
      `);
      console.log('[seed] Jogos de exemplo criados com jogos de exemplo com seleções da Copa 2026, bandeiras, grupos e valores por bolão.');
    } else {
      console.log('[seed] Jogos já existem. Seed de jogos ignorado.');
    }

    const email = 'cliente@petfunny.com.br';
    const whatsapp = '16999999999';
    const existingTutor = await query(`SELECT id FROM tutors WHERE LOWER(email)=LOWER($1::text) OR whatsapp=$2::text LIMIT 1`, [email, whatsapp]);
    if (!existingTutor.rows[0]) {
      await query(`
        INSERT INTO tutors (name, whatsapp, email, password_hash)
        VALUES ($1::text, $2::text, $3::text, $4::text)
      `, ['Cliente Teste PetFunny', whatsapp, email, await bcrypt.hash('petfunny123', 10)]);
      console.log('[seed] Participante de teste criado: cliente@petfunny.com.br / petfunny123');
    }
  } finally {
    await closePool();
  }
}

seed().catch(async (error) => {
  printDatabaseErrorHelp(error, 'seed');
  console.error('[seed:error]', error.message || error);
  await closePool().catch(() => null);
  process.exit(1);
});
