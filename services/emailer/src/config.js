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
  GMAIL: process.env.GMAIL_EMAIL
    ? {
        email: process.env.GMAIL_EMAIL,
        appPassword: process.env.GMAIL_APP_PASSWORD,
        fromEmail: process.env.EMAIL_FROM,
        replyToEmail: process.env.EMAIL_REPLY_TO,
        bccEmails: process.env.EMAIL_BCC,
      }
    : null,
  SMTP: process.env.SMTP_SERVER
    ? {
        server: process.env.SMTP_SERVER,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE || false,
        authentication: !!process.env.SMTP_USERNAME,
        username: process.env.SMTP_USERNAME,
        password: process.env.SMTP_PASSWORD,
        fromEmail: process.env.EMAIL_FROM,
        replyToEmail: process.env.EMAIL_REPLY_TO,
        bccEmails: process.env.EMAIL_BCC,
      }
    : null,
  MAILGUN: process.env.MAILGUN_API_KEY
    ? {
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN,
        fromEmail: process.env.EMAIL_FROM,
        replyToEmail: process.env.EMAIL_REPLY_TO,
        bccEmails: process.env.EMAIL_BCC,
      }
    : null,
  PDFGENERATOR_URL:
    process.env.PDFGENERATOR_URL || 'http://localhost:8082/pdfgenerator',
  TEMPORARY_DIRECTORY:
    process.env.TEMPORARY_DIRECTORY || path.join(root_dir, '/tmp'),
};
