import * as Express from 'express';
import { EnvironmentConfig, Service, URLUtils } from '@microrealestate/common';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import logger from 'winston';

Main();

async function onStartUp(express: Express.Application) {
  exposeFrontends(express);
  configureCORS(express);
  exposeServices(express);
}

async function Main() {
  let service;
  try {
    service = Service.getInstance(
      new EnvironmentConfig({
        PORT: Number(process.env.PORT) || 8080,
        EXPOSE_FRONTENDS: process.env.EXPOSE_FRONTENDS === 'true',
        AUTHENTICATOR_URL: process.env.AUTHENTICATOR_URL,
        API_URL: process.env.API_URL,
        PDFGENERATOR_URL: process.env.PDFGENERATOR_URL,
        RESETSERVICE_URL: process.env.RESETSERVICE_URL,
        LANDLORD_FRONTEND_URL: process.env.LANDLORD_FRONTEND_URL,
        LANDLORD_BASE_PATH: process.env.LANDLORD_BASE_PATH,
        TENANT_FRONTEND_URL: process.env.TENANT_FRONTEND_URL,
        TENANT_BASE_PATH: process.env.TENANT_BASE_PATH,
        DOMAIN_URL: process.env.DOMAIN_URL || 'http://localhost',
        CORS_ENABLED: process.env.CORS_ENABLED === 'true',
        TENANTAPI_URL: process.env.TENANTAPI_URL
      })
    );
    await service.init({
      name: 'Gateway',
      useRequestParsers: false,
      onStartUp
    });
    await service.startUp();
  } catch (error) {
    logger.error(String(error));
    service?.shutDown(-1);
  }
}

function configureCORS(express: Express.Application) {
  const config = Service.getInstance().envConfig.getValues();
  if (config.CORS_ENABLED && config.DOMAIN_URL) {
    const { domain } = URLUtils.destructUrl(config.DOMAIN_URL);
    const corsOptions = {
      origin: new RegExp(`^https?://(.*\\.)?${domain}$`),
      methods: 'GET,POST,PUT,PATCH,DELETE',
      allowedHeaders:
        //',If-Modified-Since,Range, DNT',
        'Origin,User-Agent,X-Requested-With,Cache-Control,Content-Type,Accept,Authorization,organizationId,timeout',
      credentials: true
    };

    express.use('/api', cors(corsOptions));
    express.use('/tenantapi', cors(corsOptions));
  }
}

function exposeFrontends(express: Express.Application) {
  const config = Service.getInstance().envConfig.getValues();
  if (config.EXPOSE_FRONTENDS) {
    if (!config.LANDLORD_BASE_PATH) {
      throw new Error('LANDLORD_BASE_PATH is not defined');
    }
    express.use(
      config.LANDLORD_BASE_PATH,
      createProxyMiddleware({
        target: config.LANDLORD_FRONTEND_URL,
        ws: true
      })
    );

    if (!config.TENANT_BASE_PATH) {
      throw new Error('TENANT_BASE_PATH is not defined');
    }
    express.use(
      config.TENANT_BASE_PATH,
      createProxyMiddleware({
        target: config.TENANT_FRONTEND_URL,
        ws: true
      })
    );
  }
}

function exposeServices(express: Express.Application) {
  const config = Service.getInstance().envConfig.getValues();
  express.use(
    '/api/v2/authenticator',
    createProxyMiddleware({
      target: config.AUTHENTICATOR_URL,
      pathRewrite: { '^/api/v2/authenticator': '' }
    })
  );

  express.use(
    '/api/v2/documents',
    createProxyMiddleware({
      target: config.PDFGENERATOR_URL,
      pathRewrite: { '^/api/v2': '' }
    })
  );

  express.use(
    '/api/v2/templates',
    createProxyMiddleware({
      target: config.PDFGENERATOR_URL,
      pathRewrite: { '^/api/v2': '' }
    })
  );

  express.use(
    '/api/v2',
    createProxyMiddleware({
      target: config.API_URL,
      pathRewrite: { '^/api/v2': '' }
    })
  );

  express.use(
    '/tenantapi',
    createProxyMiddleware({
      target: config.TENANTAPI_URL,
      pathRewrite: { '^/tenantapi': '' }
    })
  );

  // Do not expose reset api on Prod
  if (!config.PRODUCTION) {
    express.use(
      '/api/reset',
      createProxyMiddleware({
        target: config.RESETSERVICE_URL,
        pathRewrite: { '^/api': '' }
      })
    );
  }
}
