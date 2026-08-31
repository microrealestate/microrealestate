import {
  EnvironmentConfig,
  formatError,
  logger,
  Middlewares,
  Service,
  ServiceError,
  type ServiceType
} from '@microrealestate/common';
import axios from 'axios';
import type { Application, Request, RequestHandler, Response } from 'express';
import type { RateLimitRequestHandler } from 'express-rate-limit';
import rateLimit from 'express-rate-limit';
import type { SlowDownRequestHandler } from 'express-slow-down';
import slowDown from 'express-slow-down';
import { legacyCreateProxyMiddleware as createProxyMiddleware } from 'http-proxy-middleware';

const logProvider = () => logger;
const LANDLORD_BASE_PATH = '/landlord';
const TENANT_BASE_PATH = '/tenant';

let generalLimiter: RateLimitRequestHandler | RequestHandler = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (request: Request, response: Response) => {
    logger.warn(`general rate limit exceeded for ${request.ip}`);
    response.sendStatus(429);
  }
});

let authLimiter: RateLimitRequestHandler | RequestHandler = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.path?.indexOf('/session') !== -1 ||
    req.path?.indexOf('/refreshtoken') !== -1 ||
    req.path?.indexOf('/signout') !== -1 ||
    req.path?.indexOf('/signup/status') !== -1,
  handler: (request: Request, response: Response) => {
    logger.warn(`auth rate limit exceeded for ${request.ip}`);
    response.sendStatus(429);
  }
});

let otpLimiter: RateLimitRequestHandler | RequestHandler = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    !req.path?.includes('/tenant/signin') &&
    !req.path?.includes('/tenant/signedin'),
  handler: (request: Request, response: Response) => {
    logger.warn(`OTP rate limit exceeded for ${request.ip}`);
    response.sendStatus(429);
  }
});

let forgotPasswordLimiter: RateLimitRequestHandler | RequestHandler = rateLimit(
  {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => !req.path?.includes('/landlord/forgotpassword'),
    handler: (request: Request, response: Response) => {
      logger.warn(`forgot password rate limit exceeded for ${request.ip}`);
      response.sendStatus(429);
    }
  }
);

let authSpeedLimiter: SlowDownRequestHandler | RequestHandler = slowDown({
  windowMs: 10 * 60 * 1000,
  delayAfter: 2, // Allow 2 requests without delay
  delayMs: (hits) => (hits - 2) * 2000, // Add 2 seconds delay per request after the limit
  maxDelayMs: 10000, // Maximum delay of 10 seconds per request
  skipSuccessfulRequests: true, // Reset delay if a request is successful
  skip: (req) =>
    req.path?.indexOf('/session') !== -1 ||
    req.path?.indexOf('/refreshtoken') !== -1 ||
    req.path?.indexOf('/signout') !== -1 ||
    req.path?.indexOf('/signup/status') !== -1
});

Main();

async function onStartUp(application: Application) {
  const config = Service.getInstance().envConfig.getValues();
  if (!config.PRODUCTION) {
    const passThrough: RequestHandler = (
      _req: Request,
      _res: Response,
      next
    ) => {
      next();
    };
    generalLimiter = passThrough;
    authLimiter = passThrough;
    otpLimiter = passThrough;
    forgotPasswordLimiter = passThrough;
    authSpeedLimiter = passThrough;
  }

  application.set('trust proxy', config.TRUST_PROXY);
  application.use(generalLimiter);
  if (config.PRODUCTION) {
    application.use((_req, res, next) => {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
      );
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      next();
    });
  }
  if (config.LOGGER_LEVEL === 'debug') {
    application.get('/ip', (req, res) => res.send(req.ip));
  }
  exposeHealthCheck(application);
  exposeServices(application);
  exposeFrontends(application);
}

async function Main() {
  let service: ServiceType | null = null;
  try {
    service = Service.getInstance(
      new EnvironmentConfig({
        PORT: Number(process.env.PORT) || 8080,
        TRUST_PROXY: process.env.TRUST_PROXY || 'uniquelocal',
        AUTHENTICATOR_URL: process.env.AUTHENTICATOR_URL,
        API_URL: process.env.API_URL,
        PDFGENERATOR_URL: process.env.PDFGENERATOR_URL,
        EMAILER_URL: process.env.EMAILER_URL,
        RESETSERVICE_URL: process.env.RESETSERVICE_URL,
        LANDLORD_FRONTEND_URL: process.env.LANDLORD_FRONTEND_URL,
        TENANT_FRONTEND_URL: process.env.TENANT_FRONTEND_URL,
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
    logger.error(formatError(error as Error));
    service?.shutDown(-1);
  }
}

function exposeFrontends(application: Application) {
  const config = Service.getInstance().envConfig.getValues();
  application.use(
    LANDLORD_BASE_PATH,
    createProxyMiddleware({
      target: config.LANDLORD_FRONTEND_URL,
      ws: true,
      logProvider
    })
  );

  application.use(
    TENANT_BASE_PATH,
    createProxyMiddleware({
      target: config.TENANT_FRONTEND_URL,
      ws: true,
      logProvider
    })
  );
}

function exposeServices(application: Application) {
  const config = Service.getInstance().envConfig.getValues();
  application.use(
    '/api/v2/authenticator',
    authSpeedLimiter,
    authLimiter,
    otpLimiter,
    forgotPasswordLimiter,
    createProxyMiddleware({
      target: config.AUTHENTICATOR_URL,
      pathRewrite: { '^/api/v2/authenticator': '' },
      logProvider
    })
  );

  application.use(
    '/api/v2/documents',
    createProxyMiddleware({
      target: config.PDFGENERATOR_URL,
      pathRewrite: { '^/api/v2': '' },
      logProvider
    })
  );

  application.use(
    '/api/v2/templates',
    createProxyMiddleware({
      target: config.PDFGENERATOR_URL,
      pathRewrite: { '^/api/v2': '' },
      logProvider
    })
  );

  application.use(
    '/api/v2',
    createProxyMiddleware({
      target: config.API_URL,
      pathRewrite: { '^/api/v2': '' },
      logProvider
    })
  );

  application.use(
    '/tenantapi',
    createProxyMiddleware({
      target: config.TENANTAPI_URL,
      pathRewrite: { '^/tenantapi': '' },
      logProvider
    })
  );

  // Do not expose reset api on Prod
  if (!config.PRODUCTION && config.RESETSERVICE_URL) {
    application.use(
      '/api/reset',
      createProxyMiddleware({
        target: config.RESETSERVICE_URL,
        pathRewrite: { '^/api': '' },
        logProvider
      })
    );
  }
}

function exposeHealthCheck(application: Application) {
  application.get(
    '/health',
    Middlewares.asyncWrapper(async (_req: Request, res: Response) => {
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

      const notDefinedEnpoints = serviceEndpoints.filter(
        (endpoint) => !endpoint
      );
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

      endpoints.push(
        `${config.LANDLORD_FRONTEND_URL}${LANDLORD_BASE_PATH}/health`
      );
      endpoints.push(`${config.TENANT_FRONTEND_URL}${TENANT_BASE_PATH}/health`);

      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          try {
            const response = await axios.get(endpoint);
            return { status: response.status };
          } catch (error) {
            return { status: 500, error };
          }
        })
      );
      results.forEach((result, index) => {
        if (result.status !== 200) {
          logger.error(
            `${result.status} GET ${endpoints[index]}\n\t${result.error}`
          );
        } else {
          logger.info(`${result.status} GET ${endpoints[index]}`);
        }
      });
      if (results.some((result) => result.status !== 200)) {
        throw new ServiceError('Some services are down', 500);
      }

      res.status(200).send('OK');
    })
  );
}
