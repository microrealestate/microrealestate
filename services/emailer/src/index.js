// eslint-disable-next-line import/no-unresolved
import { EnvironmentConfig, Service } from '@microrealestate/common';
import { fileURLToPath } from 'url';
import fs from 'fs';
import logger from 'winston';
import path from 'path';
import routes from './routes.js';

Main();

async function onStartUp(express) {
  const { TEMPORARY_DIRECTORY } = Service.getInstance().envConfig.getValues();
  if (!fs.existsSync(TEMPORARY_DIRECTORY)) {
    fs.mkdirSync(TEMPORARY_DIRECTORY);
  }
  express.use(routes());
}

async function Main() {
  let service;
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const root_dir = path.join(__dirname, '..');

    service = Service.getInstance(
      new EnvironmentConfig({
        PORT: Number(process.env.PORT || 8083),
        ALLOW_SENDING_EMAILS:
          process.env.NODE_ENV === 'production' ||
          process.env.ALLOW_SENDING_EMAILS === 'true',
        APP_NAME: process.env.APP_NAME || 'MicroRealEstate',
        LANDLORD_APP_URL:
          process.env.LANDLORD_APP_URL || 'http://localhost:8080/landlord',
        TENANT_APP_URL:
          process.env.TENANT_APP_URL || 'http://localhost:8080/tenant',
        GMAIL: process.env.GMAIL_EMAIL
          ? {
              email: process.env.GMAIL_EMAIL,
              appPassword: process.env.GMAIL_APP_PASSWORD,
              fromEmail: process.env.EMAIL_FROM,
              replyToEmail: process.env.EMAIL_REPLY_TO,
              bccEmails: process.env.EMAIL_BCC
            }
          : null,
        SMTP: process.env.SMTP_SERVER
          ? {
              server: process.env.SMTP_SERVER,
              port: Number(process.env.SMTP_PORT || 587),
              secure: process.env.SMTP_SECURE || false,
              authentication: !!process.env.SMTP_USERNAME,
              username: process.env.SMTP_USERNAME,
              password: process.env.SMTP_PASSWORD,
              fromEmail: process.env.EMAIL_FROM,
              replyToEmail: process.env.EMAIL_REPLY_TO,
              bccEmails: process.env.EMAIL_BCC
            }
          : null,
        MAILGUN: process.env.MAILGUN_API_KEY
          ? {
              apiKey: process.env.MAILGUN_API_KEY,
              domain: process.env.MAILGUN_DOMAIN,
              fromEmail: process.env.EMAIL_FROM,
              replyToEmail: process.env.EMAIL_REPLY_TO,
              bccEmails: process.env.EMAIL_BCC
            }
          : null,
        PDFGENERATOR_URL:
          process.env.PDFGENERATOR_URL || 'http://localhost:8082/pdfgenerator',
        TEMPORARY_DIRECTORY:
          process.env.TEMPORARY_DIRECTORY || path.join(root_dir, '/tmp')
      })
    );

    await service.init({
      name: 'Emailer',
      useMongo: true,
      onStartUp
    });
    await service.startUp();
  } catch (error) {
    logger.error(String(error));
    service?.shutDown(-1);
  }
}
