import { query } from '../telegram.js';
import { escapeHtml, requireEnv, normalizeTelegramId } from '../validators.js';

export async function ensureUserExists(instanceId, telegramUser) {
  const telegramId = BigInt(telegramUser.id);
  const firstName = String(telegramUser.first_name ?? 'User').trim() || 'User';
  const username = telegramUser.username ? String(telegramUser.username).trim() : null;
  const languageCode = telegramUser.language_code ?? null;

  const existing = await query(
    `SELECT * FROM users WHERE instance_id = $1 AND telegram_id = $2`,
    [instanceId, telegramId]
  );

  if (existing.rows[0]) {
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

export async function getUserProfile(instanceId, telegramId) {
  const result = await query(
    `SELECT * FROM users WHERE instance_id = $1 AND telegram_id = $2`,
    [instanceId, telegramId]
  );
  return result.rows[0] ?? null;
}

export async function getUsersByInstance(instanceId, limit = 20, offset = 0) {
  const result = await query(
    `SELECT * FROM users WHERE instance_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [instanceId, limit, offset]
  );
  return result.rows;
}

export async function getActiveUsersCount(instanceId) {
  const result = await query(
    `SELECT COUNT(*)::int AS count FROM users WHERE instance_id = $1 AND created_at >= NOW() - INTERVAL '7 days'`,
    [instanceId]
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function blockUser(instanceId, telegramId) {
  const result = await query(
    `UPDATE users
     SET is_blocked = TRUE,
         updated_at = NOW()
     WHERE instance_id = $1 AND telegram_id = $2
     RETURNING *`,
    [instanceId, telegramId]
  );
  return result.rows[0] ?? null;
}

export async function unblockUser(instanceId, telegramId) {
  const result = await query(
    `UPDATE users
     SET is_blocked = FALSE,
         updated_at = NOW()
     WHERE instance_id = $1 AND telegram_id = $2
     RETURNING *`,
    [instanceId, telegramId]
  );
  return result.rows[0] ?? null;
}

export async function getPublicProfileSummary(instanceId, telegramId) {
  const user = await getUserProfile(instanceId, telegramId);
  if (!user) {
    return null;
  }

  return {
    telegram_id: user.telegram_id,
    username: user.username ? `@${escapeHtml(user.username)}` : 'N/A',
    first_name: escapeHtml(user.first_name),
    vip_status: user.is_vip_lifetime ? 'Lifetime VIP' : user.vip_until && new Date(user.vip_until).getTime() > Date.now() ? 'VIP Active' : 'No VIP',
    blocked: user.is_blocked
  };
}

export default {
  ensureUserExists,
  getUserProfile,
  getUsersByInstance,
  getActiveUsersCount,
  blockUser,
  unblockUser,
  getPublicProfileSummary
};
