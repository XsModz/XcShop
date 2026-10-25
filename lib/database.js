import pg from 'pg';
import { env } from './validators.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 25000
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function withTransaction(callback) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getInstanceById(instanceId) {
  const result = await query('SELECT * FROM instances WHERE id = $1', [instanceId]);
  return result.rows[0] ?? null;
}

export async function getUserByTelegramId(instanceId, telegramId) {
  const result = await query(
    'SELECT * FROM users WHERE instance_id = $1 AND telegram_id = $2',
    [instanceId, telegramId]
  );
  return result.rows[0] ?? null;
}

export async function getUserById(instanceId, userId) {
  const result = await query(
    'SELECT * FROM users WHERE instance_id = $1 AND id = $2',
    [instanceId, userId]
  );
  return result.rows[0] ?? null;
}

export async function ensureUserRecord(instanceId, telegramUser) {
  const telegramId = BigInt(telegramUser.id);
  const firstName = String(telegramUser.first_name || 'User').trim() || 'User';
  const username = telegramUser.username ? String(telegramUser.username).trim() : null;
  const languageCode = telegramUser.language_code ?? null;

  const existing = await getUserByTelegramId(instanceId, telegramId);
  if (existing) {
    const updated = await query(
      `UPDATE users
       SET first_name = $1,
           username = $2,
           language_code = $3,
           updated_at = NOW()
       WHERE instance_id = $4 AND telegram_id = $5
       RETURNING *`,
      [firstName, username, languageCode, instanceId, telegramId]
    );
    return updated.rows[0];
  }

  const inserted = await query(
    `INSERT INTO users (instance_id, telegram_id, first_name, username, language_code)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [instanceId, telegramId, firstName, username, languageCode]
  );

  return inserted.rows[0];
}

export async function ensureProcessedUpdate(instanceId, updateId) {
  const result = await query(
    `INSERT INTO processed_updates (instance_id, update_id)
     VALUES ($1, $2)
     ON CONFLICT (instance_id, update_id) DO NOTHING
     RETURNING id`,
    [instanceId, updateId]
  );

  return result.rowCount > 0;
}

export default {
  pool,
  query,
  withTransaction,
  getInstanceById,
  getUserByTelegramId,
  getUserById,
  ensureUserRecord,
  ensureProcessedUpdate
};
