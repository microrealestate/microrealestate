const crypto = require('crypto');
const config = require('../config');

const key = config.CIPHER_KEY;
const iv_key = config.CIPHER_IV_KEY;

const iv = crypto.createHash('sha256').update(iv_key).digest();
const bufferedIV = Buffer.allocUnsafe(16);
iv.copy(bufferedIV);

function encrypt(text) {
  const hashedKey = crypto.createHash('sha256').update(key).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', hashedKey, bufferedIV);
  return [cipher.update(text, 'binary', 'hex'), cipher.final('hex')].join('');
}

function decrypt(encryptedText) {
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

module.exports = {
  encrypt,
  decrypt,
};
