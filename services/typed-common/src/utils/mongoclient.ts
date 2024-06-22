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

  async connect() {
    if (!this._connection) {
      const { MONGO_URL } = this.envConfig.getValues();
      if (!MONGO_URL) {
        throw new Error('MONGO_URL is not set');
      }
      logger.debug(`connecting to ${MONGO_URL}...`);
      // mongoose.set('strictQuery', false);
      this._connection = await mongoose.connect(MONGO_URL);
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

  async dropCollection(collection: string) {
    if (this._connection) {
      logger.debug(`dropping collection ${collection}...`);
      await this._connection.connection.db.dropCollection(collection);
      logger.debug(`collection ${collection} dropped`);
    }
  }
}
