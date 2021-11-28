const logger = require('winston');

const config = require('./config');
const server = require('./server');
const db = require('./models/db');
const mongoosedb = require('./models/mongoose/db');
const restoredb = require('../scripts/mongorestore');
const migratedb = require('../scripts/migration');

require('./utils/httpinterceptors')();

async function startService() {
  try {
    await db.init();
    await mongoosedb.start();

    if (config.restoreDatabase) {
      await restoredb();
      logger.debug('database restored');
    }

    // migrate db to the new models
    // await migratedb();

    server.listen(config.appHttpPort, () => {
      config.log();
      logger.info('Listening port ' + config.appHttpPort);
      if (config.productive) {
        logger.info('In production mode');
      } else {
        logger.info('In development mode');
      }
    });
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

startService();
