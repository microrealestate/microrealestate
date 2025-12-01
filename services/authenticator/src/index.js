import { EnvironmentConfig, logger, Service } from '@microrealestate/common';
import routes from './routes/index.js';

Main();
function split(thing) {
  if (typeof thing === 'string') {
    return thing.split('/');
  } else if (thing.fast_slash) {
    return '';
  } else {
    const match = thing
      .toString()
      .replace('\\/?', '')
      .replace('(?=\\/|$)', '$')
      .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|\w)*)\$\//);
    return match ? match[1].replace(/\\(.)/g, '$1').split('/') : '';
  }
}
function printRoutes(app, path = []) {
  app._router?.stack.forEach(function (layer) {
    if (layer.route) {
      // Routes registered directly on the app or a router
      const fullPath = path.concat(layer.route.path).join('');
      console.log(
        `${Object.keys(layer.route.methods).join(', ').toUpperCase()} ${fullPath}`
      );
    } else if (layer.name === 'router' && layer.handle.stack) {
      // Nested routers
      printRoutes(layer.handle, path.concat(split(layer.regexp)));
    } else if (layer.method) {
      // Middleware that acts like a route (e.g., app.use without a path)
      const fullPath = path
        .concat(split(layer.regexp))
        .filter(Boolean)
        .join('');
      console.log(`${layer.method.toUpperCase()} /${fullPath}`);
    }
  });
}

async function onStartUp(express) {
  express.use(routes());
  console.log(express._router.stack.map((l) => l.name));
  // printRoutes(express, []);
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
