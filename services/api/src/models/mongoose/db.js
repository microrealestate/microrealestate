const mongoose = require('mongoose');
const logger = require('winston');
const config = require('../../config');

let connection;

process.on('SIGINT', async () => {
  exit();
});

async function start() {
  if (!connection) {
    logger.debug(`db connecting to ${config.database}...`);
    connection = await mongoose.connect(config.database, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.debug('db ready');
  }
}

async function exit() {
  if (connection) {
    logger.debug('db disconnecting...');
    await mongoose.disconnect();
    connection = null;
    logger.debug('db disconnected');
  }
}

module.exports = {
  start,
};
