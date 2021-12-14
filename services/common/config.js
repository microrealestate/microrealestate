const _ = require('lodash');
const logger = require('winston');

module.exports = {
  LOGGER_LEVEL: process.env.LOGGER_LEVEL || 'debug',

  MONGO_URL:
    process.env.MONGO_URL ||
    process.env.BASE_DB_URL ||
    'mongodb://localhost/demodb',
  REDIS_URL:
    process.env.REDIS_URL ||
    process.env.TOKEN_DB_URL ||
    'redis://localhost:6379',
  REDIS_PASSWORD: process.env.TOKEN_DB_PASSWORD || undefined,

  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  RESET_TOKEN_SECRET: process.env.RESET_TOKEN_SECRET,
  CIPHER_KEY: process.env.CIPHER_KEY,
  CIPHER_IV_KEY: process.env.CIPHER_IV_KEY,

  log: function log() {
    const { log, ...config } = this;
    const escapedConfig = _.cloneDeep(config);
    escapedConfig.REDIS_PASSWORD = '****';
    escapedConfig.ACCESS_TOKEN_SECRET = '****';
    escapedConfig.REFRESH_TOKEN_SECRET = '****';
    escapedConfig.RESET_TOKEN_SECRET = '****';
    escapedConfig.CIPHER_KEY = '****';
    escapedConfig.CIPHER_IV_KEY = '****';
    if (escapedConfig.MAILGUN?.apiKey) {
      escapedConfig.MAILGUN.apiKey = '****';
    }
    Object.entries(escapedConfig)
      .sort(([key1], [key2]) => key1.localeCompare(key2))
      .reduce(
        (acc, [key, value]) => [...acc, `${key}: ${JSON.stringify(value)}`],
        []
      )
      .forEach((configLine) => logger.debug(configLine));
  },
};
