import dotenv from 'dotenv';

dotenv.config();

const required = [
  'BOT_TOKEN',
  'ADMIN_ID',
  'STORAGE_CHAT_ID',
  'DATABASE_URL',
  'WEBHOOK_SECRET',
  'BASE_URL',
  'SUPPORT_USERNAME',
  'ENCRYPTION_KEY'
];

export function requireEnv(name, value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return String(value).trim();
}

export function ensureValidEnv() {
  const env = {};

  for (const name of required) {
    env[name] = requireEnv(name, process.env[name]);
  }

  if (!/^\d+:[A-Za-z0-9_-]+$/.test(env.BOT_TOKEN)) {
    throw new Error('BOT_TOKEN must look like a Telegram bot token: <id>:<token>');
  }

  const adminId = Number(env.ADMIN_ID);
  if (!Number.isInteger(adminId) || adminId <= 0) {
    throw new Error('ADMIN_ID must be a positive integer Telegram user id');
  }

  const storageChatId = Number(env.STORAGE_CHAT_ID);
  if (!Number.isInteger(storageChatId)) {
    throw new Error('STORAGE_CHAT_ID must be an integer Telegram chat id');
  }

  if (!/^[-_A-Za-z0-9]{1,256}$/.test(env.WEBHOOK_SECRET)) {
    throw new Error('WEBHOOK_SECRET must be 1-256 chars using letters, numbers, hyphen or underscore');
  }

  if (!/^https?:\/\/.test(env.BASE_URL)) {
    throw new Error('BASE_URL must be an absolute HTTP or HTTPS URL');
  }

  env.BASE_URL = env.BASE_URL.replace(/\/+$/, '');

  if (env.SUPPORT_USERNAME.startsWith('@')) {
    env.SUPPORT_USERNAME = env.SUPPORT_USERNAME.slice(1);
  }

  if (!/^[A-Za-z0-9_]{1,32}$/.test(env.SUPPORT_USERNAME)) {
    throw new Error('SUPPORT_USERNAME must be a Telegram username without @');
  }

  if (!/^[0-9a-fA-F]{64}$/.test(env.ENCRYPTION_KEY)) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hexadecimal string (AES-256)');
  }

  const superAdmin = process.env.SUPER_ADMIN_ID;
  if (superAdmin && superAdmin !== '') {
    const parsed = Number(superAdmin);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error('SUPER_ADMIN_ID must be a positive integer Telegram user id when set');
    }
  }

  const multiInstance = process.env.MULTI_INSTANCE;
  if (multiInstance && multiInstance !== 'true' && multiInstance !== 'false') {
    throw new Error('MULTI_INSTANCE must be set to "true" or "false"');
  }

  return {
    ...env,
    SUPER_ADMIN_ID: superAdmin && superAdmin !== '' ? String(superAdmin).trim() : String(env.ADMIN_ID),
    MULTI_INSTANCE: (multiInstance || 'false').toLowerCase() === 'true'
  };
}

export function normalizeTelegramId(input) {
  const value = Number(input);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error('Telegram ID must be a positive integer');
  }
  return BigInt(value);
}

export function parseIntStrict(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${fieldName} must be an integer`);
  }
  return parsed;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeText(value) {
  return String(value ?? '').trim();
}

export const env = ensureValidEnv();

export default env;
