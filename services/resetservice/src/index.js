const logger = require('winston');
const server = require('@microrealestate/common/utils/server');
const config = require('./config');
const routes = require('./routes');

async function onStartUp(express) {
  express.use(routes);
}

async function Main() {
  try {
    await server.init({
      name: 'Reset service',
      port: config.PORT,
      useMongo: true,
      useRedis: true,
      onStartUp,
    });
    await server.startUp();
  } catch (err) {
    logger.error(err);
    server.shutdown(1);
  }
}

Main();
