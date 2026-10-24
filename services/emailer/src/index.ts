import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EnvironmentConfig,
  formatError,
  logger,
  Service,
  type ServiceType
} from '@microrealestate/common';
import type * as Express from 'express';
import i18n from 'i18n';
import { TEMPORARY_DIRECTORY } from './directories';
import routes from './routes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

Main();

async function onStartUp(express: Express.Application) {
  fs.mkdirSync(TEMPORARY_DIRECTORY, { recursive: true });
  try {
    for (const entry of fs.readdirSync(TEMPORARY_DIRECTORY)) {
      fs.rmSync(path.join(TEMPORARY_DIRECTORY, entry), {
        recursive: true,
        force: true
      });
    }
  } catch (error) {
    logger.error(formatError(error));
  }
  express.use(routes());
}

async function Main() {
  i18n.configure({
    locales: ['en', 'fr-FR', 'pt-BR', 'de-DE', 'es-CO'],
    directory: path.join(__dirname, 'locales'),
    updateFiles: false
  });

  let service: ServiceType | null = null;
  try {
    service = Service.getInstance(
      new EnvironmentConfig({
        PORT: Number(process.env.PORT || 8083),
        PDFGENERATOR_URL:
          process.env.PDFGENERATOR_URL || 'http://localhost:8082/pdfgenerator',
        SMTP_ALLOWED_PORTS: process.env.SMTP_ALLOWED_PORTS ?? ''
      })
    );

    await service.init({
      name: 'Emailer',
      useMongo: true,
      onStartUp
    });
    await service.startUp();
  } catch (error) {
    logger.error(formatError(error as Error));
    service?.shutDown(-1);
  }
}
