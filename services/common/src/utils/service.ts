import type { RealmType } from '@microrealestate/shared';
import _cookieParser from 'cookie-parser';
import express, { type Application } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import expressWinston from 'express-winston';
import { v4 as uuidv4 } from 'uuid';
import type EnvironmentConfig from './environmentconfig';
import httpInterceptors from './httpinterceptors';
import * as Logger from './logger';
import _methodOverride from './methodoverride';
import * as Middlewares from './middlewares';
import MongoClient from './mongoclient';
import RedisClient from './redisclient';

const shutDownOnSignal = async () => {
  try {
    await Service.getInstance()?.shutDown(0);
  } catch (error) {
    Logger.default.error(Logger.formatError(error));
  }
};

process.on('SIGINT', shutDownOnSignal);
process.on('SIGTERM', shutDownOnSignal);

type ServiceOptions = {
  name: string;
  useMongo?: boolean;
  useRedis?: boolean;
  useAxios?: boolean;
  useRequestParsers?: boolean;
  exposeHealthCheck?: boolean;
  onStartUp?: (express: Application) => Promise<void>;
  onShutDown?: () => Promise<void>;
};

export type LandlordServicePrincipal = {
  type: 'landlord';
  email: string;
};
export type TenantServicePrincipal = {
  type: 'tenant';
  email: string;
};
type ServicePrincipal = LandlordServicePrincipal | TenantServicePrincipal;

export type RealmInRequestType = Omit<RealmType, '_id'> & {
  _id: string;
};

declare global {
  namespace Express {
    interface Request {
      user: ServicePrincipal;
      realm?: RealmInRequestType;
    }
  }
}

export default class Service {
  private static instance: Service | null = null;
  static getInstance(envConfig?: EnvironmentConfig) {
    if (!Service.instance) {
      if (!envConfig) {
        throw new Error('envConfig is required');
      }
      Service.instance = new Service(envConfig);
    }
    return Service.instance;
  }

  name?: string;
  port?: number;
  useMongo?: boolean;
  useRedis?: boolean;
  useAxios?: boolean;
  useRequestParsers?: boolean;
  exposeHealthCheck?: boolean;
  onStartUp?: (express: Application) => Promise<void>;
  onShutDown?: () => Promise<void>;

  mongoClient?: MongoClient;
  redisClient?: RedisClient;

  envConfig: EnvironmentConfig;
  expressServer: Application;

  private constructor(envConfig: EnvironmentConfig) {
    this.envConfig = envConfig;
    this.expressServer = express();
  }

  async init({
    name,
    useMongo,
    useRedis,
    useAxios,
    useRequestParsers = true,
    exposeHealthCheck = true,
    onStartUp,
    onShutDown
  }: ServiceOptions) {
    this.name = name;
    this.port = this.envConfig.getValues().PORT;
    this.useAxios = useAxios;
    this.useRequestParsers = useRequestParsers;
    this.exposeHealthCheck = exposeHealthCheck;
    this.onStartUp = onStartUp;
    this.onShutDown = onShutDown;
    this.useMongo = useMongo;
    this.useRedis = useRedis;

    Logger.default.configure({
      transports: Logger.transports,
      defaultMeta: {
        service_name: name
      }
    });

    if (useMongo) {
      this.mongoClient = MongoClient.getInstance(this.envConfig);
    }

    if (useRedis) {
      this.redisClient = RedisClient.getInstance(this.envConfig);
    }

    if (this.useAxios) {
      httpInterceptors();
    }

    // Inject requestId in response
    this.expressServer.use((req, res, next) => {
      const requestId = req.headers['request-id'] || uuidv4();
      res.setHeader('request-id', requestId);
      next();
    });

    if (this.useRequestParsers) {
      this.expressServer.use(_cookieParser());
      this.expressServer.use(express.urlencoded({ extended: true }));
      this.expressServer.use(express.json());
      this.expressServer.use(_methodOverride());
      if (this.useMongo) {
        this.expressServer.use(
          mongoSanitize({
            allowDots: true,
            replaceWith: '_',
            onSanitize: ({ key }) => {
              Logger.default.warn(`request[${key}] has been sanitized`);
            }
          })
        );
      }
    }

    this.expressServer.use(
      expressWinston.logger({
        transports: Logger.transports,
        baseMeta: {
          service_name: name
        },
        meta: true, // optional: control whether you want to log the meta data about the request (default to true)
        requestWhitelist: ['method', 'url', 'query', 'params'],
        responseWhitelist: ['statusCode'],
        expressFormat: false, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
        colorize: false // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
      })
    );
  }

  private async startService() {
    return new Promise<void>((resolve, reject) => {
      this.expressServer
        .listen(this.port, () => {
          Logger.default.info(
            `${this.name} ready and listening on port ${this.port}`
          );
          resolve();
        })
        .on('error', async (err) => {
          Logger.default.error(Logger.formatError(err));
          if (this.mongoClient) {
            try {
              await this.mongoClient.disconnect();
            } catch (error) {
              Logger.default.error(Logger.formatError(error as Error));
            }
          }
          if (this.redisClient) {
            try {
              await this.redisClient.disconnect();
            } catch (error) {
              Logger.default.error(Logger.formatError(error as Error));
            }
          }
          reject(err);
        });
    });
  }

  async startUp() {
    Logger.default.info(`Starting ${this.name}...`);
    this.envConfig.log();
    if (this.mongoClient) {
      await this.mongoClient.connect();
    }
    if (this.redisClient) {
      await this.redisClient.connect();
      // await this.redisClient.monitor();
    }

    if (this.exposeHealthCheck) {
      this.expressServer.get('/health', async (_req, res) => {
        res.status(200).send('OK');
      });
    }

    await this.onStartUp?.(this.expressServer);

    // add error middleware
    this.expressServer.use(Middlewares.errorHandler);
    await this.startService();
  }

  async shutDown(errCode: number) {
    if (this.mongoClient) {
      try {
        await this.mongoClient.disconnect();
      } catch (error) {
        Logger.default.error(Logger.formatError(error as Error));
      }
    }
    if (this.redisClient) {
      try {
        await this.redisClient.disconnect();
      } catch (error) {
        Logger.default.error(Logger.formatError(error as Error));
      }
    }
    await this.onShutDown?.();
    process.exit(errCode);
  }
}

export type ServiceType = Service;
export function getInstance(envConfig?: EnvironmentConfig) {
  return Service.getInstance(envConfig);
}
