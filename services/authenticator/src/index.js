const logger = require('winston');
const server = require('@microrealestate/common/utils/server');
const routes = require('./routes');
const { config } = require('./config');

async function onStartUp(express) {
  express.use(routes);
}

async function Main() {
  try {
    await server.init({
      name: 'Authenticator',
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
