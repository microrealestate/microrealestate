const mongoose = require('mongoose');
const logger = require('winston');
const config = require('../config');

let connection;

const connect = async () => {
  if (!connection) {
    logger.debug(`connecting to ${config.MONGO_URL}...`);
    connection = await mongoose.connect(config.MONGO_URL);
    logger.debug('db ready');
  }
};

const disconnect = async () => {
  if (connection) {
    logger.debug('disconnecting db...');
    await mongoose.disconnect();
    connection = null;
    logger.debug('db disconnected');
  }
};

process.on('SIGINT', async () => {
  try {
    await disconnect();
  } catch (error) {
    console.error(error);
  }
});

module.exports = {
  connect,
  disconnect,
  connection: () => mongoose.connection.db,
};
