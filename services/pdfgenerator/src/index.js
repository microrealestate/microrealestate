const locale = require('locale');
const logger = require('winston');
const server = require('@microrealestate/common/utils/server');
const pdf = require('./pdf');
const config = require('./config');
const routes = require('./routes');

async function onStartUp(express) {
  // Start pdf engine
  await pdf.start();

  // parse locale
  express.use(locale(['fr-FR', 'en-US', 'pt-BR', 'de-DE'], 'en-US'));

  // api
  express.use(routes);
}

async function onShutDown() {
  await pdf.exit();
}

async function Main() {
  try {
    await server.init({
      name: 'PdfGenerator',
      port: config.PORT,
      useMongo: true,
      onStartUp,
      onShutDown,
    });
    await server.startUp();
  } catch (err) {
    logger.error(err);
    server.shutdown(1);
  }
}

Main();
