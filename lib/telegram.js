import { env } from './validators.js';

export function buildTelegramApiUrl(token, method) {
  return `https://api.telegram.org/bot${token}/${method}`;
}

export async function telegramRequest(token, method, payload = {}) {
  const response = await fetch(buildTelegramApiUrl(token, method), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!data || data.ok !== true) {
    const error = new Error(`Telegram API error for ${method}`);
    error.details = data;
    throw error;
  }

  return data.result;
}

export async function sendMessage(token, chatId, text, options = {}) {
  return telegramRequest(token, 'sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...options
  });
}

export async function copyMessage(token, fromChatId, messageId, toChatId, options = {}) {
  return telegramRequest(token, 'copyMessage', {
    from_chat_id: fromChatId,
    message_id: messageId,
    chat_id: toChatId,
    ...options
  });
}

export async function deleteMessage(token, chatId, messageId) {
  return telegramRequest(token, 'deleteMessage', {
    chat_id: chatId,
    message_id: messageId
  });
}

export async function answerCallbackQuery(token, callbackQueryId, text, showAlert = false) {
  return telegramRequest(token, 'answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
    show_alert: showAlert
  });
}

export async function editMessageText(token, chatId, messageId, text, extra = {}) {
  return telegramRequest(token, 'editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    ...extra
  });
}

export async function setWebhook(token, url, secretToken) {
  return telegramRequest(token, 'setWebhook', {
    url,
    secret_token: secretToken,
    allowed_updates: ['message', 'callback_query', 'inline_query']
  });
}

export async function getMe(token) {
  return telegramRequest(token, 'getMe', {});
}

export const defaultSupportUsername = env.SUPPORT_USERNAME;

export default {
  buildTelegramApiUrl,
  telegramRequest,
  sendMessage,
  copyMessage,
  deleteMessage,
  answerCallbackQuery,
  editMessageText,
  setWebhook,
  getMe
};
