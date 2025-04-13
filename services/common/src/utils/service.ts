import * as Logger from './logger.js';
import {
  ConnectionRole,
  InternalServicePrincipal,
  ServiceOptions
} from '@microrealestate/types';
import _cookieParser from 'cookie-parser';
import _methodOverride from 'method-override';
import EnvironmentConfig from './environmentconfig.js';
import Express from 'express';
import expressWinston from 'express-winston';
import httpInterceptors from './httpinterceptors.js';
import jwt from 'jsonwebtoken';
import { Middlewares } from '../index.js';
import MongoClient from './mongoclient.js';
import mongoSanitize from 'express-mongo-sanitize';
import RedisClient from './redisclient.js';
import winston from 'winston';

process.on('SIGINT', async () => {
  try {
    await Service.getInstance()?.shutDown(0);
  } catch (error) {
    console.error(error);
  }
});

export default class Service {
  static cookieParser = _cookieParser;
  static methodOverride = _methodOverride;
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
  onStartUp?: (express: Express.Application) => Promise<void>;
  onShutDown?: () => Promise<void>;

  mongoClient?: MongoClient;
  redisClient?: RedisClient;

  envConfig: EnvironmentConfig;
  expressServer: Express.Application;

  private constructor(envConfig: EnvironmentConfig) {
    this.envConfig = envConfig;
    this.expressServer = Express();
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

    if (useMongo) {
      this.mongoClient = MongoClient.getInstance(this.envConfig);
    }

    if (useRedis) {
      this.redisClient = RedisClient.getInstance(this.envConfig);
    }

    if (this.useAxios) {
      httpInterceptors();
    }

    if (this.useRequestParsers) {
      this.expressServer.use(_cookieParser());
      this.expressServer.use(Express.urlencoded({ extended: true }));
      this.expressServer.use(Express.json());
      this.expressServer.use(_methodOverride());
      if (this.useMongo) {
        mongoSanitize({
          allowDots: true,
          replaceWith: '_',
          onSanitize: ({ req, key }: { req: Express.Request; key: string }) => {
            console.warn(`request[${key}] has been sanitized`, req);
          }
        });
      }
    }

    this.expressServer.use(
      expressWinston.logger({
        transports: Logger.transports,
        format: winston.format.simple(),
        meta: false, // optional: control whether you want to log the meta data about the request (default to true)
        msg: '{{req.method}} {{res.statusCode}} {{res.responseTime}}ms {{req.url}}', //'HTTP {{req.method}} {{req.url}}', // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
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
          Logger.default.error(String(err));
          if (this.mongoClient) {
            try {
              await this.mongoClient.disconnect();
            } catch (error) {
              Logger.default.error(String(error));
            }
          }
          if (this.redisClient) {
            try {
              await this.redisClient.disconnect();
            } catch (error) {
              Logger.default.error(String(error));
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
      this.expressServer.get('/health', async (req, res) => {
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
        Logger.default.error(String(error));
      }
    }
    if (this.redisClient) {
      try {
        await this.redisClient.disconnect();
      } catch (error) {
        Logger.default.error(String(error));
      }
    }
    await this.onShutDown?.();
    process.exit(errCode);
  }

  async createServiceToken(role: ConnectionRole, realmId: string) {
    const { ACCESS_TOKEN_SECRET } = this.envConfig.getValues();
    if (!ACCESS_TOKEN_SECRET) {
      throw new Error('ACCESS_TOKEN_SECRET is required');
    }

    const service: InternalServicePrincipal = {
      type: 'service',
      serviceId: this.name || 'unknown',
      realmId,
      role
    };
    const accessToken = jwt.sign({ service }, ACCESS_TOKEN_SECRET, {
      expiresIn: '30s'
    });

    return accessToken;
  }
}
