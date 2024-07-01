// eslint-disable-next-line import/no-unresolved
import { EnvironmentConfig, Service } from '@microrealestate/common';
import logger from 'winston';
import routes from './routes/index.js';

Main();

async function onStartUp(express) {
  express.use(routes());
}

async function Main() {
  let service;
  try {
    const DOMAIN_URL = new URL(
      process.env.DOMAIN_URL || 'http://localhost:8083'
    );

    service = Service.getInstance(
      new EnvironmentConfig({
        PORT: Number(process.env.PORT || 8083),
        EMAILER_URL: process.env.EMAILER_URL || 'http://localhost:8083/emailer',
        SIGNUP: process.env.SIGNUP === 'true',
        TOKEN_COOKIE_ATTRIBUTES: {
          httpOnly: true,
          sameSite: 'strict',
          secure: DOMAIN_URL.protocol === 'https:',
          domain: DOMAIN_URL.hostname
        }
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
    logger.error(String(error));
    service?.shutDown(-1);
  }
}
