import EnvironmentConfig from './environmentconfig.js';
import logger from 'winston';
import redis from 'redis';
import { RedisClientTypes } from '@microrealestate/types';

process.on('SIGINT', async () => {
  try {
    await RedisClient.getInstance()?.disconnect();
  } catch (error) {
    console.error(error);
  }
});

export default class RedisClient {
  private static instance: RedisClient | null = null;
  static getInstance(envConfig?: EnvironmentConfig) {
    if (!RedisClient.instance) {
      if (!envConfig) {
        throw new Error('envConfig is required');
      }
      RedisClient.instance = new RedisClient(envConfig);
    }
    return RedisClient.instance;
  }

  private client: redis.RedisClientType | null = null;
  private envConfig: EnvironmentConfig;

  get: RedisClientTypes.GetFunction = () => Promise.resolve(null);
  set: RedisClientTypes.SetFunction = () => Promise.resolve(null);
  del: RedisClientTypes.DelFunction = () => Promise.resolve(-1);
  keys: RedisClientTypes.KeysFunction = () => Promise.resolve([]);
  // monitor: RedisClientTypes.MonitorFunction = () => Promise.resolve();

  private constructor(envConfig: EnvironmentConfig) {
    this.envConfig = envConfig;
  }

  async connect() {
    const config = this.envConfig.getValues();
    const obfuscatedConfig = this.envConfig.getObfuscatedValues();
    logger.debug(`db connecting to ${obfuscatedConfig.REDIS_URL}...`);
    if (!config.REDIS_URL) {
      throw new Error('REDIS_URL is not set');
    }
    this.client = redis.createClient({
      url: config.REDIS_URL,
      password: config.REDIS_PASSWORD,
    });
    this.client.on('error', (err) => logger.error(`Redis Error: ${err}`));
    this.client.on('connect', () => logger.debug('Redis connected'));
    this.client.on('reconnecting', () => logger.info('Redis reconnecting'));
    this.client.on('ready', () => {
      logger.debug('Redis ready');
    });
    // this.client.on('monitor', (time, args /*, rawReply*/) => {
    //   if (args && args.length && args[0] === 'auth') {
    //     args[1] = '****';
    //   }
    //   logger.debug(args.join(', '));
    // });

    this.get = this.client.get.bind(this.client);
    this.set = this.client.set.bind(this.client);
    this.del = this.client.del.bind(this.client);
    this.keys = this.client.keys.bind(this.client);
    // this.monitor = this.client.monitor.bind(this.client);

    await this.client.connect();
  }

  async disconnect() {
    if (!this.client) {
      throw new Error('cannot quit, connection not established');
    }

    await this.client.quit();
  }
}
