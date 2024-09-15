import mongoose, { Mongoose } from 'mongoose';
import EnvironmentConfig from './environmentconfig.js';
import logger from 'winston';

process.on('SIGINT', async () => {
  try {
    await MongoClient.getInstance()?.disconnect();
  } catch (error) {
    console.error(error);
  }
});

export default class MongoClient {
  private static instance: MongoClient | null = null;
  static getInstance(envConfig?: EnvironmentConfig) {
    if (!MongoClient.instance) {
      if (!envConfig) {
        throw new Error('envConfig is required');
      }
      MongoClient.instance = new MongoClient(envConfig);
    }
    return MongoClient.instance;
  }
  private _connection: Mongoose | null = null;
  private envConfig: EnvironmentConfig;

  private constructor(envConfig: EnvironmentConfig) {
    this.envConfig = envConfig;
  }

  connection() {
    return mongoose.connection.db;
  }

  async connect() {
    if (!this._connection) {
      logger.debug(`connecting to ${this.envConfig.getValues().MONGO_URL}...`);
      const config = this.envConfig.getValues();
      if (!config.MONGO_URL) {
        throw new Error('MONGO_URL is not set');
      }
      this._connection = await mongoose.connect(config.MONGO_URL);
      logger.debug('db ready');
    }
  }

  async disconnect() {
    if (this._connection) {
      logger.debug('disconnecting db...');
      await mongoose.disconnect();
      this._connection = null;
      logger.debug('db disconnected');
    }
  }
}
