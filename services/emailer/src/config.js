const path = require('path');
const root_dir = path.join(__dirname, '..');

module.exports = {
  LOGGER_LEVEL: process.env.LOGGER_LEVEL || 'debug',
  PRODUCTIVE: process.env.NODE_ENV === 'production',
  ALLOW_SENDING_EMAILS:
    process.env.NODE_ENV === 'production' ||
    process.env.ALLOW_SENDING_EMAILS === 'true',
  APP_NAME: process.env.APP_NAME || 'Loca',
  APP_URL: process.env.APP_URL || 'http://localhost:8080/app',
  PORT: process.env.PORT || 8083,
  MONGO_URL:
    process.env.MONGO_URL ||
    process.env.DB_URL ||
    'mongodb://localhost/sampledb',
  MAILGUN: {
    apiKey: process.env.MAILGUN_API_KEY || 'your_api_key',
    domain: process.env.MAILGUN_DOMAIN || 'mg.example.com',
  },
  PDFGENERATOR_URL:
    process.env.PDFGENERATOR_URL || 'http://localhost:8082/pdfgenerator',
  TEMPORARY_DIRECTORY:
    process.env.TEMPORARY_DIRECTORY || path.join(root_dir, '/tmp'),
  EMAIL: {
    FROM: process.env.EMAIL_FROM || 'Example <noreply@example.com>',
    REPLY_TO: process.env.EMAIL_REPLY_TO || 'customer-service@example.com',
    BCC: process.env.EMAIL_BCC || 'manager1@example.com,manager2@example.com',
  },
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'access_token_secret',
  CIPHER_KEY: process.env.CIPHER_KEY || 'cipher_key_secret',
  CIPHER_IV_KEY: process.env.CIPHER_IV_KEY || 'cipher_iv_key_secret',
};
