import * as Express from 'express';
import {
  EnvironmentConfig,
  logger,
  Middlewares,
  Service,
  ServiceError,
  URLUtils
} from '@microrealestate/common';
import axios from 'axios';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

type EndpointCheck = {
  endpoint: string;
  status: number;
  error?: string;
};

Main();

async function onStartUp(application: Express.Application) {
  exposeHealthCheck(application);
  exposeFrontends(application);
  configureCORS(application);
  exposeServices(application);
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
        EMAILER_URL: process.env.EMAILER_URL,
        RESETSERVICE_URL: process.env.RESETSERVICE_URL,
        LANDLORD_FRONTEND_URL: process.env.LANDLORD_FRONTEND_URL,
        LANDLORD_BASE_PATH: process.env.LANDLORD_BASE_PATH,
        TENANT_FRONTEND_URL: process.env.TENANT_FRONTEND_URL,
        TENANT_BASE_PATH: process.env.TENANT_BASE_PATH,
        DOMAIN_URL: process.env.DOMAIN_URL || 'http://localhost', // deprecated
        APP_DOMAIN: process.env.APP_DOMAIN,
        CORS_ENABLED: process.env.CORS_ENABLED === 'true',
        TENANTAPI_URL: process.env.TENANTAPI_URL
      })
    );
    await service.init({
      name: 'Gateway',
      useRequestParsers: false,
      exposeHealthCheck: false,
      onStartUp
    });
    await service.startUp();
  } catch (error) {
    logger.error(String(error));
    service?.shutDown(-1);
  }
}

function configureCORS(application: Express.Application) {
  const config = Service.getInstance().envConfig.getValues();
  if (config.CORS_ENABLED && (config.DOMAIN_URL || config.APP_DOMAIN)) {
    // Prefer APP_DOMAIN when available. DOMAIN_URL is kept for backward compatibility.
    const domain =
      config.APP_DOMAIN ||
      (config.DOMAIN_URL ? URLUtils.destructUrl(config.DOMAIN_URL).domain : undefined);
    if (!domain) {
      return;
    }
    const corsOptions = {
      origin: new RegExp(`^https?://(.*\\.)?${domain}$`),
      methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      allowedHeaders:
        //',If-Modified-Since,Range, DNT',
        'Origin,User-Agent,X-Requested-With,Cache-Control,Content-Type,Accept,Authorization,organizationId,timeout',
      credentials: true
    };

    application.use('/api', cors(corsOptions));
    application.options('/api/*', cors(corsOptions));
    application.use('/tenantapi', cors(corsOptions));
    application.options('/tenantapi/*', cors(corsOptions));
  }
}

function exposeFrontends(application: Express.Application) {
  const config = Service.getInstance().envConfig.getValues();
  if (config.EXPOSE_FRONTENDS) {
    if (!config.LANDLORD_BASE_PATH) {
      throw new Error('LANDLORD_BASE_PATH is not defined');
    }
    application.use(
      config.LANDLORD_BASE_PATH,
      createProxyMiddleware({
        target: config.LANDLORD_FRONTEND_URL,
        ws: true
      })
    );

    if (!config.TENANT_BASE_PATH) {
      throw new Error('TENANT_BASE_PATH is not defined');
    }
    application.use(
      config.TENANT_BASE_PATH,
      createProxyMiddleware({
        target: config.TENANT_FRONTEND_URL,
        ws: true
      })
    );
  }
}

function exposeServices(application: Express.Application) {
  const config = Service.getInstance().envConfig.getValues();
  application.use(
    '/api/v2/authenticator',
    createProxyMiddleware({
      target: config.AUTHENTICATOR_URL,
      pathRewrite: { '^/api/v2/authenticator': '' }
    })
  );

  application.use(
    '/api/v2/documents',
    createProxyMiddleware({
      target: config.PDFGENERATOR_URL,
      pathRewrite: { '^/api/v2': '' }
    })
  );

  application.use(
    '/api/v2/templates',
    createProxyMiddleware({
      target: config.PDFGENERATOR_URL,
      pathRewrite: { '^/api/v2': '' }
    })
  );

  application.use(
    '/api/v2',
    createProxyMiddleware({
      target: config.API_URL,
      pathRewrite: { '^/api/v2': '' }
    })
  );

  application.use(
    '/tenantapi',
    createProxyMiddleware({
      target: config.TENANTAPI_URL,
      pathRewrite: { '^/tenantapi': '' }
    })
  );

  // Do not expose reset api on Prod
  if (!config.PRODUCTION) {
    application.use(
      '/api/reset',
      createProxyMiddleware({
        target: config.RESETSERVICE_URL,
        pathRewrite: { '^/api': '' }
      })
    );
  }
}

function exposeHealthCheck(application: Express.Application) {
  async function getEndpointChecks() {
    const config = Service.getInstance().envConfig.getValues();

    const serviceEndpoints = [
      config.AUTHENTICATOR_URL,
      config.API_URL,
      config.TENANTAPI_URL,
      config.PDFGENERATOR_URL,
      config.EMAILER_URL
    ];

    if (!config.PRODUCTION) {
      serviceEndpoints.push(config.RESETSERVICE_URL);
    }

    const notDefinedEnpoints = serviceEndpoints.filter((endpoint) => !endpoint);
    if (notDefinedEnpoints.length) {
      throw new ServiceError(
        `${notDefinedEnpoints.join(', ')} env ${
          notDefinedEnpoints.length > 1 ? 'are' : 'is'
        } not defined`,
        500
      );
    }

    const endpoints = serviceEndpoints.map((endpoint) => {
      const url = new URL(endpoint as string);
      return `${url.origin}/health`;
    });

    if (config.EXPOSE_FRONTENDS) {
      if (!config.LANDLORD_BASE_PATH || !config.TENANT_BASE_PATH) {
        throw new ServiceError(
          'LANDLORD_BASE_PATH or TENANT_BASE_PATH env is not defined',
          500
        );
      }
      endpoints.push(
        `${config.LANDLORD_FRONTEND_URL}${config.LANDLORD_BASE_PATH}/health`
      );
      endpoints.push(
        `${config.TENANT_FRONTEND_URL}${config.TENANT_BASE_PATH}/health`
      );
    }

    const checks: EndpointCheck[] = await Promise.all(
      endpoints.map(async (endpoint) => {
        try {
          const response = await axios.get(endpoint, { timeout: 8000 });
          return { endpoint, status: response.status };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          return { endpoint, status: 500, error: errorMessage };
        }
      })
    );

    checks.forEach((check) => {
      if (check.status !== 200) {
        logger.error(`${check.status} GET ${check.endpoint}\n\t${check.error}`);
      } else {
        logger.info(`${check.status} GET ${check.endpoint}`);
      }
    });

    return checks;
  }

  function escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderHealthPage(checks: EndpointCheck[]) {
    const allHealthy = checks.every((check) => check.status === 200);
    const rows = checks
      .map((check) => {
        const statusLabel = check.status === 200 ? 'UP' : 'DOWN';
        const rowClass = check.status === 200 ? 'ok' : 'ko';
        return `<tr class="${rowClass}">
  <td>${escapeHtml(statusLabel)}</td>
  <td>${check.status}</td>
  <td>${escapeHtml(check.endpoint)}</td>
  <td>${escapeHtml(check.error || '')}</td>
</tr>`;
      })
      .join('\n');

    const summaryClass = allHealthy ? 'ok' : 'ko';
    const summaryText = allHealthy
      ? 'All services are healthy'
      : 'Some services are down';

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="15" />
  <title>MicroRealEstate Health</title>
  <style>
    :root { color-scheme: light; }
    body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; margin: 24px; background: #f4f7fb; color: #1b2533; }
    .card { background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 4px 16px rgba(12, 26, 75, 0.08); }
    h1 { margin: 0 0 8px; font-size: 24px; }
    .meta { margin: 0 0 16px; color: #4e5d78; font-size: 14px; }
    .summary { display: inline-block; padding: 6px 10px; border-radius: 6px; font-weight: 600; margin-bottom: 14px; }
    .summary.ok { background: #e9f8ef; color: #166534; }
    .summary.ko { background: #feecec; color: #991b1b; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { text-align: left; border-bottom: 1px solid #e6ecf5; padding: 8px; vertical-align: top; }
    th { font-size: 13px; color: #4e5d78; }
    tr.ok td:first-child { color: #166534; font-weight: 700; }
    tr.ko td:first-child { color: #991b1b; font-weight: 700; }
    .actions { margin-top: 14px; }
    .btn { display: inline-block; text-decoration: none; background: #0f62fe; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>MicroRealEstate Health Dashboard</h1>
    <p class="meta">Auto-refresh every 15 seconds</p>
    <div class="summary ${summaryClass}">${summaryText}</div>
    <table>
      <thead>
        <tr>
          <th>State</th>
          <th>HTTP</th>
          <th>Endpoint</th>
          <th>Error</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
    <div class="actions">
      <a class="btn" href="/health/ui">Refresh</a>
    </div>
  </div>
</body>
</html>`;
  }

  application.get(
    '/health',
    Middlewares.asyncWrapper(async (req, res) => {
      const checks = await getEndpointChecks();
      if (checks.some((check) => check.status !== 200)) {
        throw new ServiceError('Some services are down', 500);
      }

      res.status(200).send('OK');
    })
  );

  application.get(
    '/health/ui',
    Middlewares.asyncWrapper(async (req, res) => {
      const checks = await getEndpointChecks();
      const allHealthy = checks.every((check) => check.status === 200);
      res
        .status(allHealthy ? 200 : 503)
        .contentType('text/html; charset=utf-8')
        .send(renderHealthPage(checks));
    })
  );
}
