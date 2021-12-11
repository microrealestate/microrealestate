const { promisify } = require('util');
const redis = require('redis');
const logger = require('winston');
const config = require('../config');

class RedisClient {
  connect(url, options) {
    return new Promise((resolve, reject) => {
      this.client = redis.createClient(url, options);
      this.client.on('monitor', (time, args /*, rawReply*/) => {
        if (args && args.length && args[0] === 'auth') {
          args[1] = '****';
        }
        logger.debug(args.join(', '));
      });

      //this.flushdb = promisify(this.client.flushdb).bind(this.client);
      this.get = promisify(this.client.get).bind(this.client);
      this.set = promisify(this.client.set).bind(this.client);
      this.del = promisify(this.client.del).bind(this.client);
      this.keys = promisify(this.client.keys).bind(this.client);
      this.monitor = promisify(this.client.monitor).bind(this.client);

      this.client.on('error', reject);
      this.client.on('ready', resolve);
    });
  }

  quit() {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject('cannot quit, connection not established');
        return;
      }

      this.client.quit((err, res) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
  }
}

const redisClient = new RedisClient();

const connect = async () => {
  logger.debug(`db connecting to ${config.REDIS_URL}...`);
  await redisClient.connect(
    config.REDIS_URL,
    config.REDIS_PASSWORD ? { password: config.REDIS_PASSWORD } : undefined
  );
  logger.debug('Redis ready');
};

const monitor = async () => {
  await redisClient.monitor();
};

const get = async (...params) => {
  return await redisClient.get(...params);
};

const set = async (...params) => {
  return await redisClient.set(...params);
};

const del = async (...params) => {
  return await redisClient.del(...params);
};

const keys = async (...params) => {
  return await redisClient.keys(...params);
};

const disconnect = async () => {
  if (redisClient.client) {
    await redisClient.quit();
  }
};

process.on('SIGINT', async () => {
  try {
    await disconnect();
  } catch (error) {
    logger.error(error);
  }
});

module.exports = {
  connect,
  disconnect,
  monitor,
  get,
  set,
  del,
  keys,
};
