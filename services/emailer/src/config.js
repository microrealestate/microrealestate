const path = require('path');
const baseConfig = require('@microrealestate/common/config');

const root_dir = path.join(__dirname, '..');

module.exports = {
  ...baseConfig,
  ALLOW_SENDING_EMAILS:
    process.env.NODE_ENV === 'production' ||
    process.env.ALLOW_SENDING_EMAILS === 'true',
  APP_NAME: process.env.APP_NAME || 'Loca',
  LANDLORD_APP_URL:
    process.env.LANDLORD_APP_URL || 'http://localhost:8080/landlord',
  TENANT_APP_URL: process.env.TENANT_APP_URL || 'http://localhost:8080/tenant',
  PORT: process.env.PORT || 8083,
  GMAIL: {
    email: process.env.GMAIL_EMAIL || 'example@gmail.com',
    appPassword: process.env.GMAIL_APP_PASSWORD || 'wwww xxxx yyyy zzzz',
  },
  SMTP: {
    server: process.env.SMTP_SERVER || 'smtp.example.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE || false,
    authentication: !!process.env.SMTP_USERNAME,
    username: process.env.SMTP_USERNAME || 'your_username',
    password: process.env.SMTP_PASSWORD || 'your_strong_password',
  },
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
