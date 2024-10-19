import { EnvironmentConfig, logger, Service } from '@microrealestate/common';
import routes from './routes/index.js';

Main();

async function onStartUp(express) {
  express.use(routes());
}

async function Main() {
  let service;
  try {
    let tokenCookieSecure = process.env.APP_PROTOCOL === 'https';
    let tokenCookieDomain = process.env.APP_DOMAIN || 'localhost';

    // to be removed in next version of the app (deprecated)
    if (process.env.DOMAIN_URL) {
      const DOMAIN_URL = new URL(
        process.env.DOMAIN_URL || 'http://localhost:8083'
      );
      tokenCookieSecure = DOMAIN_URL.protocol === 'https:';
      tokenCookieDomain = DOMAIN_URL.hostname;
    }

    service = Service.getInstance(
      new EnvironmentConfig({
        PORT: Number(process.env.PORT || 8083),
        EMAILER_URL: process.env.EMAILER_URL || 'http://localhost:8083/emailer',
        SIGNUP: process.env.SIGNUP === 'true',
        TOKEN_COOKIE_ATTRIBUTES: {
          httpOnly: true,
          sameSite: 'strict',
          secure: tokenCookieSecure,
          domain: tokenCookieDomain
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
