import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Collections,
  EnvironmentConfig,
  formatError,
  logger,
  Service,
  type ServiceType
} from '@microrealestate/common';
import type { Application } from 'express';
import i18n from 'i18n';
import migratedb from '../scripts/migration';
import startCronJobs from './crons';
import { syncWebServerFromDb } from './managers/webserver';
import routes from './routes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

i18n.configure({
  locales: ['en', 'fr-FR', 'pt-BR', 'de-DE', 'es-CO'],
  directory: path.join(__dirname, 'locales'),
  updateFiles: false
});

async function onStartUp(application: Application) {
  // migrate db to the new models
  await migratedb();

  // single-organization edition: warn when the database contains several realms
  const realmCount = await Collections.Realm.countDocuments({});
  if (realmCount > 1) {
    logger.warn(
      `${realmCount} organizations found in the database but this application only supports one. ` +
        'Users will be signed in to one of the organizations they are a member of. ' +
        'The other organizations data remains in the database but is not reachable from the UI.'
    );
  }

  startCronJobs();

  void syncWebServerFromDb();

  application.use(routes());
}

async function Main() {
  let service: ServiceType | undefined;
  try {
    service = Service.getInstance(
      new EnvironmentConfig({
        EMAILER_URL: process.env.EMAILER_URL || 'http://localhost:8083/emailer',
        PDFGENERATOR_URL:
          process.env.PDFGENERATOR_URL || 'http://localhost:8082/pdfgenerator',
        CADDY_ADMIN_URL:
          process.env.CADDY_ADMIN_URL || 'http://reverse-proxy:2019'
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
    logger.error(formatError(err));
    service?.shutDown(1);
  }
}

Main();
