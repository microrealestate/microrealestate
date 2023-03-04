const fs = require('fs');
const logger = require('winston');
const server = require('@microrealestate/common/utils/server');
const config = require('./config');
const routes = require('./routes');

async function onStartUp(express) {
  if (!fs.existsSync(config.TEMPORARY_DIRECTORY)) {
    fs.mkdirSync(config.TEMPORARY_DIRECTORY);
  }
  express.use(routes);
}

async function Main() {
  try {
    await server.init({
      name: 'Emailer',
      port: config.PORT,
      useMongo: true,
      onStartUp,
    });
    await server.startUp();
  } catch (err) {
    logger.error(err);
    server.shutdown(1);
  }
}

Main();
