const path = require('path');
const baseConfig = require('@mre/common/config');

const root_dir = path.join(__dirname, '..');

module.exports = {
  ...baseConfig,
  PRODUCTIVE: process.env.NODE_ENV === 'production',
  ALLOW_SENDING_EMAILS:
    process.env.NODE_ENV === 'production' ||
    process.env.ALLOW_SENDING_EMAILS === 'true',
  APP_NAME: process.env.APP_NAME || 'Loca',
  APP_URL: process.env.APP_URL || 'http://localhost:8080/app',
  PORT: process.env.PORT || 8083,
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
};
