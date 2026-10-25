import crypto from 'node:crypto';
import { env } from './validators.js';

const KEY_BYTES = Buffer.from(env.ENCRYPTION_KEY, 'hex');

if (KEY_BYTES.length !== 32) {
  throw new Error('ENCRYPTION_KEY must decode to exactly 32 bytes for AES-256-GCM');
}

export function encryptToken(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY_BYTES, iv);

  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final()
  ]);

  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    ciphertext: encrypted.toString('hex'),
    tag: tag.toString('hex')
  };
}

export function decryptToken(storedJson) {
  let payload = storedJson;

  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch (error) {
      throw new Error('Encrypted token payload is invalid JSON');
    }
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('Encrypted token payload is not an object');
  }

  const { iv, ciphertext, tag } = payload;
  if (!iv || !ciphertext || !tag) {
    throw new Error('Encrypted token payload missing required fields');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY_BYTES, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'hex')),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

export function encryptTokenStorage(plaintext) {
  return JSON.stringify(encryptToken(plaintext));
}

export default {
  encryptToken,
  decryptToken,
  encryptTokenStorage
};
