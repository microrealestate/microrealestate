import { EnvironmentConfig, logger, Service } from '@microrealestate/common';
import { fileURLToPath } from 'url';
import i18n from 'i18n';
import { initializeOneDriveService } from './services/onedrive.js';
import migratedb from '../scripts/migration.js';
import path from 'path';
import { restoreDB } from '../scripts/dbbackup.js';
import routes from './routes.js';
import { startUtilityImportScheduler } from './managers/utilitymanager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

i18n.configure({
  locales: ['en', 'fr-FR', 'pt-BR', 'de-DE', 'es-CO'],
  directory: path.join(__dirname, 'locales'),
  updateFiles: false
});

async function onStartUp(application) {
  const { RESTORE_DB } = Service.getInstance().envConfig.getValues();
  if (RESTORE_DB) {
    logger.debug('restoring database from backup');
    await restoreDB();
    logger.debug('database restored');
  }

  // migrate db to the new models
  await migratedb();

  // Initialize OneDrive backup service
  const envConfig = Service.getInstance().envConfig.getValues();
  initializeOneDriveService({
    enabled:
      envConfig.ONEDRIVE_ENABLED === true ||
      envConfig.ONEDRIVE_ENABLED === 'true',
    tenantId: envConfig.ONEDRIVE_TENANT_ID,
    clientId: envConfig.ONEDRIVE_CLIENT_ID,
    clientSecret: envConfig.ONEDRIVE_CLIENT_SECRET,
    rootFolder: envConfig.ONEDRIVE_ROOT_FOLDER || 'ButlerPMS'
  });

  if (envConfig.ONEDRIVE_ENABLED) {
    logger.info('OneDrive backup service initialized');
  }

  application.use(routes());

  startUtilityImportScheduler();
}

async function Main() {
  let service;
  try {
    logger.info('Initializing service...');
    service = Service.getInstance(
      new EnvironmentConfig({
        DEMO_MODE: process.env.DEMO_MODE
          ? process.env.DEMO_MODE.toLowerCase() === 'true'
          : undefined,
        RESTORE_DB: process.env.RESTORE_DB
          ? process.env.RESTORE_DB.toLowerCase() === 'true'
          : undefined,
        EMAILER_URL: process.env.EMAILER_URL || 'http://localhost:8083/emailer',
        LANDLORD_APP_URL:
          process.env.LANDLORD_APP_URL || 'http://localhost:8080/landlord',
        PDFGENERATOR_URL:
          process.env.PDFGENERATOR_URL || 'http://localhost:8082/pdfgenerator',
        ONEDRIVE_ENABLED: process.env.ONEDRIVE_ENABLED
          ? process.env.ONEDRIVE_ENABLED.toLowerCase() === 'true'
          : false,
        ONEDRIVE_TENANT_ID: process.env.ONEDRIVE_TENANT_ID,
        ONEDRIVE_CLIENT_ID: process.env.ONEDRIVE_CLIENT_ID,
        ONEDRIVE_CLIENT_SECRET: process.env.ONEDRIVE_CLIENT_SECRET,
        ONEDRIVE_ROOT_FOLDER: process.env.ONEDRIVE_ROOT_FOLDER || 'ButlerPMS'
      })
    );

    logger.info('Calling service.init...');
    await service.init({
      name: 'api',
      useMongo: true,
      useAxios: true,
      onStartUp
    });
    logger.info('Calling service.startUp...');
    await service.startUp();
    logger.info('Service started successfully');
  } catch (err) {
    logger.error('Error during startup:', err || 'Unknown error occurred');
    service?.shutDown(-1);
  }
}

Main();
