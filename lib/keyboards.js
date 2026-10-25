import { escapeHtml } from './validators.js';

export function buildMainMenuKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📂 Free Files', callback_data: 'free_files' }, { text: '👑 VIP Files', callback_data: 'vip_files' }],
        [{ text: '🛒 My Purchases', callback_data: 'my_purchases' }, { text: '👤 My Account', callback_data: 'my_account' }],
        [{ text: '🔑 Redeem Key', callback_data: 'redeem_key' }, { text: '🆘 Support', callback_data: 'support' }]
      ]
    }
  };
}

export function buildAdminMenuKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📊 Statistics', callback_data: 'admin_stats' }, { text: '👥 Users', callback_data: 'admin_users' }],
        [{ text: '📂 Categories', callback_data: 'admin_categories' }, { text: '📁 Files', callback_data: 'admin_files' }],
        [{ text: '👑 VIP', callback_data: 'admin_vip' }, { text: '🔑 Keys', callback_data: 'admin_keys' }],
        [{ text: '🤝 Resellers', callback_data: 'admin_resellers' }, { text: '🏪 Instances', callback_data: 'admin_instances' }],
        [{ text: '⚙️ Settings', callback_data: 'admin_settings' }, { text: '🏠 User Menu', callback_data: 'user_menu' }]
      ]
    }
  };
}

export function buildHomeKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [[{ text: '🏠 Home', callback_data: 'home' }]]
    }
  };
}

export function buildBackKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'back' }]]
    }
  };
}

export function buildBackHomeKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '⬅️ Back', callback_data: 'back' }, { text: '🏠 Home', callback_data: 'home' }]
      ]
    }
  };
}

export function buildPaginationKeyboard({ items, page, totalPages, baseData, perPage = 8 }) {
  const pageButtons = [];

  if (page > 1) {
    pageButtons.push({ text: '⬅️ Prev', callback_data: `${baseData}:p:${page - 1}` });
  }

  if (page < totalPages) {
    pageButtons.push({ text: 'Next ➡️', callback_data: `${baseData}:p:${page + 1}` });
  }

  const rows = [];
  if (items.length > 0) {
    rows.push(...items);
  }

  if (pageButtons.length > 0) {
    rows.push(pageButtons);
  }

  rows.push([{ text: '🏠 Home', callback_data: 'home' }]);
  return { reply_markup: { inline_keyboard: rows } };
}

export function wrapInlineText(text) {
  return `<b>${escapeHtml(text)}</b>`;
}

export function buildCategoryListKeyboard(categories, page, totalPages) {
  const buttons = categories.map((category) => [{
    text: `${category.is_hidden ? '🔒 ' : ''}${escapeHtml(category.name)} (${category.file_count ?? 0})`,
    callback_data: `cat:${category.id}`
  }]);

  if (buttons.length === 0) {
    const rows = [[{ text: '🏠 Home', callback_data: 'home' }]];
    return { reply_markup: { inline_keyboard: rows } };
  }

  const paginationRows = [];
  if (page > 1) {
    paginationRows.push({ text: '⬅️ Prev', callback_data: `categories:p:${page - 1}` });
  }

  if (page < totalPages) {
    paginationRows.push({ text: 'Next ➡️', callback_data: `categories:p:${page + 1}` });
  }

  const rows = [...buttons];
  if (paginationRows.length > 0) {
    rows.push(paginationRows);
  }
  rows.push([{ text: '🏠 Home', callback_data: 'home' }]);

  return { reply_markup: { inline_keyboard: rows } };
}

export function buildResellerMenuKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔑 Generate Keys', callback_data: 'reseller_generate' }, { text: '📋 My Keys', callback_data: 'reseller_keys' }],
        [{ text: '📊 My Stats', callback_data: 'reseller_stats' }, { text: '🏠 Main Menu', callback_data: 'home' }]
      ]
    }
  };
}

export function buildConfirmKeyboard(action, id) {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '✅ Confirm', callback_data: `${action}:${id}` }, { text: '❌ Cancel', callback_data: 'cancel_action' }]
      ]
    }
  };
}

export function buildYesNoKeyboard(action, value) {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '✅ Yes', callback_data: `${action}:${value}:yes` }, { text: '❌ No', callback_data: `${action}:${value}:no` }]
      ]
    }
  };
}

export function buildInlineButtonRow(buttons) {
  return buttons.map((button) => ({
    text: button.text,
    callback_data: button.data
  }));
}

export default {
  buildMainMenuKeyboard,
  buildAdminMenuKeyboard,
  buildHomeKeyboard,
  buildBackKeyboard,
  buildBackHomeKeyboard,
  buildPaginationKeyboard,
  buildCategoryListKeyboard,
  buildResellerMenuKeyboard,
  buildConfirmKeyboard,
  buildYesNoKeyboard,
  buildInlineButtonRow,
  wrapInlineText
};
