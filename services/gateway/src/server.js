const express = require('express');
const expressWinston = require('express-winston');
const logger = require('winston');
const config = require('./config');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

async function start() {
  logger.debug('starting Gateway...');
  const app = express();

  configureLogger(app);

  exposeFrontends(app);

  configureCORS(app);

  exposeServices(app);

  try {
    // Run server
    const http_port = config.PORT;
    await app.listen(http_port).on('error', (error) => {
      throw new Error(error);
    });
    config.log();
    logger.debug(`Gateway listening on port ${http_port}`);
    logger.info('Gateway ready');
  } catch (exc) {
    logger.error(exc.message);
  }
}

function configureLogger(app) {
  // configure default logger
  logger.remove(logger.transports.Console);
  logger.add(logger.transports.Console, {
    level: config.LOGGER_LEVEL,
    colorize: true,
  });

  // Express log with winston
  app.use(
    expressWinston.logger({
      transports: [
        new logger.transports.Console({
          json: false,
          colorize: true,
        }),
      ],
      meta: false, // optional: control whether you want to log the meta data about the request (default to true)
      msg: String, //'HTTP {{req.method}} {{req.url}}', // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
      expressFormat: true, // Use the default Express/morgan request formatting, with the same colors. Enabling this will override any msg and colorStatus if true. Will only output colors on transports with colorize set to true
      colorStatus: true, // Color the status code, using the Express/morgan color palette (default green, 3XX cyan, 4XX yellow, 5XX red). Will not be recognized if expressFormat is true
      //ignoreRoute: function( /*req, res*/ ) {
      //    return false;
      //} // optional: allows to skip some log messages based on request and/or response
    })
  );

  app.use(
    expressWinston.errorLogger({
      transports: [
        new logger.transports.Console({
          json: false,
          colorize: true,
        }),
      ],
    })
  );
}

function configureCORS(app) {
  if (config.CORS_ENABLED && config.DOMAIN_URL) {
    const DOMAIN_URL = new URL(config.DOMAIN_URL);
    const domain = DOMAIN_URL.hostname.split('.').slice(-2).join('.');
    const corsOptions = {
      origin: new RegExp(`^https?://(.*\\.)?${domain}$`),
      methods: 'GET,POST,PUT,PATCH,DELETE',
      allowedHeaders:
        //',If-Modified-Since,Range, DNT',
        'Origin,User-Agent,X-Requested-With,Cache-Control,Content-Type,Accept,Authorization,organizationId,timeout',
      credentials: true,
    };

    app.use('/api', cors(corsOptions));
  }
}

function exposeFrontends(app) {
  if (config.EXPOSE_FRONTENDS) {
    app.use(
      config.LANDLORD_BASE_PATH,
      createProxyMiddleware({
        target: `http://landlord-frontend:${config.LANDLORD_FRONTEND_PORT}`,
        ws: true,
      })
    );

    app.use(
      config.TENANT_BASE_PATH,
      createProxyMiddleware({
        target: `http://tenant-frontend:${config.TENANT_FRONTEND_PORT}`,
        ws: true,
      })
    );
  }
}

function exposeServices(app) {
  app.use(
    '/api/v2/authenticator',
    createProxyMiddleware({
      target: `http://authenticator:${config.AUTHENTICATOR_PORT}`,
      pathRewrite: { '^/api/v2/authenticator': '' },
    })
  );

  app.use(
    '/api/v2/documents',
    createProxyMiddleware({
      target: `http://pdfgenerator:${config.PDFGENERATOR_PORT}`,
      pathRewrite: { '^/api/v2': '/pdfgenerator' },
    })
  );

  app.use(
    '/api/v2/templates',
    createProxyMiddleware({
      target: `http://pdfgenerator:${config.PDFGENERATOR_PORT}`,
      pathRewrite: { '^/api/v2': '/pdfgenerator' },
    })
  );

  app.use(
    '/api/v2',
    createProxyMiddleware({
      target: `http://api:${config.API_PORT}`,
    })
  );

  // Do not expose reset api on Prod
  if (!config.PRODUCTIVE) {
    app.use(
      '/api/reset',
      createProxyMiddleware({
        target: `http://resetservice:${config.RESETSERVICE_PORT}`,
        pathRewrite: { '^/api': '' },
      })
    );
  }
}

module.exports = {
  start,
};
