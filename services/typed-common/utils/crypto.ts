import * as crypto from 'crypto';
import { EnvironmentValues } from '@microrealestate/types';
import Service from './service.js';

function _buildIV(config: EnvironmentValues) {
  const key = config.CIPHER_KEY;
  if (!key) {
    throw new Error('CIPHER_KEY is not set');
  }

  const ivKey = config.CIPHER_IV_KEY;
  if (!ivKey) {
    throw new Error('CIPHER_IV_KEY is not set');
  }

  const iv = crypto.createHash('sha256').update(ivKey).digest();
  const bufferedIV = Buffer.allocUnsafe(16);
  iv.copy(bufferedIV);
  return { key, bufferedIV };
}

export function encrypt(text: string) {
  const config = Service.getInstance()?.envConfig.getValues() || {};
  const { key, bufferedIV } = _buildIV(config);

  const hashedKey = crypto.createHash('sha256').update(key).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', hashedKey, bufferedIV);
  return [cipher.update(text, 'binary', 'hex'), cipher.final('hex')].join('');
}

export function decrypt(encryptedText: string) {
  const config = Service.getInstance()?.envConfig.getValues() || {};
  const { key, bufferedIV } = _buildIV(config);

  const hashedKey = crypto.createHash('sha256').update(key).digest();
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    hashedKey,
    bufferedIV
  );
  return [
    decipher.update(encryptedText, 'hex', 'binary'),
    decipher.final('binary'),
  ].join('');
}
