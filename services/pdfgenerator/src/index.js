import * as pdf from './pdf.js';
// eslint-disable-next-line import/no-unresolved
import { EnvironmentConfig, Service } from '@microrealestate/common';
import { fileURLToPath } from 'url';
import locale from 'locale';
import logger from 'winston';
import path from 'path';
import routes from './routes/index.js';

Main();

async function onStartUp(express) {
  // Start pdf engine
  await pdf.start();

  // parse locale
  express.use(locale(['fr-FR', 'en-US', 'pt-BR', 'de-DE'], 'en-US'));

  // api
  express.use(routes());
}

async function onShutDown() {
  await pdf.exit();
}

async function Main() {
  let service;
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const root_dir = path.join(__dirname, '..');

    service = Service.getInstance(
      new EnvironmentConfig({
        PORT: Number(process.env.PORT || 8082),
        DATA_DIRECTORY:
          process.env.DATA_DIRECTORY || path.join(root_dir, '/data'),
        TEMPLATES_DIRECTORY:
          process.env.TEMPLATES_DIRECTORY || path.join(root_dir, '/templates'),
        TEMPORARY_DIRECTORY:
          process.env.TEMPORARY_DIRECTORY || path.join(root_dir, '/tmp'),
        PDF_DIRECTORY:
          process.env.PDF_DIRECTORY || path.join(root_dir, '/pdf_documents'),
        UPLOADS_DIRECTORY:
          process.env.UPLOADS_DIRECTORY || path.join(root_dir, '/uploads'),
        UPLOAD_MAX_SIZE: Number(
          process.env.UPLOAD_MAX_SIZE || 2_000_000_000 /* 2Gb */
        )
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
    logger.error(String(error));
    service?.shutDown(-1);
  }
}
