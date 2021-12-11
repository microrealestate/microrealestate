const logger = require('winston');

const config = require('./config');
const server = require('./server');
const db = require('./models/db');
const mongoosedb = require('@mre/common/models/db');
const restoredb = require('../scripts/mongorestore');
// const migratedb = require('../scripts/migration');

require('@mre/common/utils/httpinterceptors')();

process.on('SIGINT', () => {
  //TODO disconnect db (mongojs)
  process.exit(0);
});

async function startService() {
  try {
    await db.init();
    await mongoosedb.connect();

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
    try {
      await mongoosedb.disconnect();
    } catch (error) {
      logger.error(error);
    }
    process.exit(1);
  }
}

startService();
