const logger = require('winston');
const i18n = require('i18n');
const path = require('path');
const server = require('@microrealestate/common/utils/server');
const { restoreDB } = require('../scripts/dbbackup');

const config = require('./config');
const db = require('./models/db');
const migratedb = require('../scripts/migration');
const routes = require('./routes');

i18n.configure({
  locales: ['en', 'fr-FR', 'pt-BR', 'de-DE'],
  directory: path.join(__dirname, 'locales'),
  updateFiles: false,
});

async function onStartUp(express) {
  if (config.restoreDatabase) {
    logger.debug('restoring database from backup');
    await restoreDB();
    logger.debug('database restored');
  }

  // migrate db to the new models
  await migratedb();

  // init mongojs
  await db.init();

  express.use(routes);
}

async function Main() {
  try {
    await server.init({
      name: 'API',
      port: config.PORT,
      useMongo: true,
      useAxios: true,
      onStartUp,
    });
    await server.startUp();
  } catch (err) {
    logger.error(err);
    server.shutdown(1);
  }
}

Main();
