import { env } from './validators.js';

export function isUserAdmin(telegramId) {
  return Number(telegramId) === Number(env.ADMIN_ID);
}

export function isUserSuperAdmin(telegramId) {
  return Number(telegramId) === Number(env.SUPER_ADMIN_ID || env.ADMIN_ID);
}

export function isVipActive(user) {
  if (!user) {
    return false;
  }

  if (user.is_vip_lifetime === true) {
    return true;
  }

  if (!user.vip_until) {
    return false;
  }

  const vipDate = new Date(user.vip_until).getTime();
  return Number.isFinite(vipDate) && vipDate > Date.now();
}

export function getVipStatusLabel(user) {
  if (!user) {
    return 'No';
  }
  if (user.is_vip_lifetime) {
    return 'Lifetime';
  }
  if (user.vip_until && new Date(user.vip_until).getTime() > Date.now()) {
    return 'Active';
  }
  return 'Expired';
}

export function isBlockedUser(user) {
  return !!(user && user.is_blocked);
}

export function toSafeUsername(username) {
  if (!username) {
    return 'N/A';
  }
  return String(username).replace(/^@/, '');
}

export function parseUserId(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('Invalid Telegram user id');
  }
  return parsed;
}

export default {
  isUserAdmin,
  isUserSuperAdmin,
  isVipActive,
  getVipStatusLabel,
  isBlockedUser,
  toSafeUsername,
  parseUserId
};
