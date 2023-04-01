const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const logger = require('winston');
const server = require('@microrealestate/common/utils/server');
const URL = require('@microrealestate/common/utils/url');
const config = require('./config');

Main();

async function onStartUp(express) {
  exposeFrontends(express);
  configureCORS(express);
  exposeServices(express);
}

async function Main() {
  try {
    await server.init({
      name: 'Gateway',
      port: config.PORT,
      useRequestParsers: false,
      onStartUp,
    });
    await server.startUp();
  } catch (err) {
    logger.error(err);
    server.shutdown(1);
  }
}

function configureCORS(app) {
  if (config.CORS_ENABLED && config.DOMAIN_URL) {
    const { domain } = URL.destructUrl(config.DOMAIN_URL);
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
      target: config.AUTHENTICATOR_URL,
      pathRewrite: { '^/api/v2/authenticator': '' },
    })
  );

  app.use(
    '/api/v2/documents',
    createProxyMiddleware({
      target: config.PDFGENERATOR_URL,
      pathRewrite: { '^/api/v2': '' },
    })
  );

  app.use(
    '/api/v2/templates',
    createProxyMiddleware({
      target: config.PDFGENERATOR_URL,
      pathRewrite: { '^/api/v2': '' },
    })
  );

  app.use(
    '/api/v2',
    createProxyMiddleware({
      target: config.API_URL,
      pathRewrite: { '^/api/v2': '' },
    })
  );

  // Do not expose reset api on Prod
  if (!config.PRODUCTION) {
    app.use(
      '/api/reset',
      createProxyMiddleware({
        target: config.RESETSERVICE_URL,
        pathRewrite: { '^/api': '' },
      })
    );
  }
}
