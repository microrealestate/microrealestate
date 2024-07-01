import * as Db from './models/db.js';
import { EnvironmentConfig, Service } from '@microrealestate/common';
import { fileURLToPath } from 'url';
import i18n from 'i18n';
import logger from 'winston';
import migratedb from '../scripts/migration.js';
import path from 'path';
import { restoreDB } from '../scripts/dbbackup.js';
import routes from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

i18n.configure({
  locales: ['en', 'fr-FR', 'pt-BR', 'de-DE'],
  directory: path.join(__dirname, 'locales'),
  updateFiles: false
});

async function onStartUp(application) {
  // init mongojs
  await Db.init();

  const { RESTORE_DB } = Service.getInstance().envConfig.getValues();
  if (RESTORE_DB) {
    logger.debug('restoring database from backup');
    await restoreDB();
    logger.debug('database restored');
  }

  // migrate db to the new models
  await migratedb();

  application.use(routes());
}

async function Main() {
  let service;
  try {
    service = Service.getInstance(
      new EnvironmentConfig({
        DEMO_MODE: process.env.DEMO_MODE
          ? process.env.DEMO_MODE.toLowerCase() === 'true'
          : undefined,
        RESTORE_DB: process.env.RESTORE_DB
          ? process.env.RESTORE_DB.toLowerCase() === 'true'
          : undefined,
        EMAILER_URL: process.env.EMAILER_URL || 'http://localhost:8083/emailer',
        PDFGENERATOR_URL:
          process.env.PDFGENERATOR_URL || 'http://localhost:8082/pdfgenerator'
      })
    );

    await service.init({
      name: 'api',
      useMongo: true,
      useAxios: true,
      onStartUp
    });
    await service.startUp();
  } catch (err) {
    logger.error(err);
    service.shutdown(1);
  }
}

Main();
