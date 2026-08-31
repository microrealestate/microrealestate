import {
  EnvironmentConfig,
  formatError,
  logger,
  Service
} from '@microrealestate/common';
import locale from 'locale';
import * as pdf from './pdf';
import routes from './routes';

Main();

async function onStartUp(express) {
  // Start pdf engine
  await pdf.start();

  // parse locale
  express.use(locale(['fr-FR', 'en-US', 'pt-BR', 'de-DE', 'es-CO'], 'en-US'));

  // api
  express.use(routes());
}

async function onShutDown() {
  await pdf.exit();
}

async function Main() {
  let service;
  try {
    service = Service.getInstance(
      new EnvironmentConfig({
        PORT: Number(process.env.PORT || 8082),
        CHROMIUM_BIN: process.env.CHROMIUM_BIN || '/usr/bin/chromium'
      })
    );

    await service.init({
      name: 'PdfGenerator',
      useMongo: true,
      onStartUp,
      onShutDown
    });
    await service.startUp();
  } catch (error) {
    logger.error(formatError(error));
    service?.shutDown(-1);
  }
}
