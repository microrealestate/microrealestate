import {
  EnvironmentConfig,
  formatError,
  logger,
  Service
} from '@microrealestate/common';
import routes from './routes';

Main();

async function onStartUp(express) {
  const { TRUST_PROXY } = Service.getInstance().envConfig.getValues();
  express.set('trust proxy', TRUST_PROXY);
  express.use(routes());
}

async function Main() {
  let service;
  try {
    service = Service.getInstance(
      new EnvironmentConfig({
        PORT: Number(process.env.PORT || 8083),
        TRUST_PROXY: process.env.TRUST_PROXY || 'uniquelocal',
        EMAILER_URL: process.env.EMAILER_URL || 'http://localhost:8083/emailer'
      })
    );

    await service.init({
      name: 'Authenticator',
      useMongo: true,
      useRedis: true,
      onStartUp
    });

    await service.startUp();
  } catch (error) {
    logger.error(formatError(error));
    service?.shutDown(-1);
  }
}
