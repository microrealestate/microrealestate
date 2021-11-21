const { promisify } = require('util');
const redis = require('redis');
const logger = require('winston');

class RedisClient {
  connect(url, options) {
    return new Promise((resolve, reject) => {
      this.client = redis.createClient(url, options);

      this.flushdb = promisify(this.client.flushdb).bind(this.client);

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
