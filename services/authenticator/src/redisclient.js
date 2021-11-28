const { promisify } = require('util');
const redis = require('redis');
const logger = require('winston');

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

      this.get = promisify(this.client.get).bind(this.client);
      this.set = promisify(this.client.set).bind(this.client);
      this.del = promisify(this.client.del).bind(this.client);
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

const instance = new RedisClient();
module.exports = instance;
