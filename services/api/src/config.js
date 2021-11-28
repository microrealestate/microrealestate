const logger = require('winston');
const sugar = require('sugar');

const toBoolean = (value) => {
  if (value && typeof value !== 'boolean') {
    value = value.toLowerCase() === 'true';
  }
  return value;
};

const config = {
  loggerLevel: process.env.LOGGER_LEVEL || 'debug',
  appHttpPort: process.env.PORT || 8080,
  businesslogic: 'FR',
  productive: process.env.NODE_ENV === 'production',
  signup: toBoolean(process.env.SIGNUP || false),
  restoreDatabase: toBoolean(process.env.RESTORE_DB || true),
  demoMode: toBoolean(process.env.DEMO_MODE || true),
  database: process.env.MONGO_URL || 'mongodb://localhost/demodb',
  EMAILER_URL: process.env.EMAILER_URL || 'http://localhost:8083/emailer',
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'access_token_secret',
  CIPHER_KEY: process.env.CIPHER_KEY || 'cipher_key_secret',
  CIPHER_IV_KEY: process.env.CIPHER_IV_KEY || 'cipher_iv_key_secret',
};

module.exports = {
  ...config,
  log: () => {
    const escapedConfig = sugar.Object.clone(config);
    escapedConfig.ACCESS_TOKEN_SECRET = '****';
    escapedConfig.CIPHER_KEY = '****';
    escapedConfig.CIPHER_IV_KEY = '****';
    Object.entries(escapedConfig)
      .sort(([key1], [key2]) => key1.localeCompare(key2))
      .reduce((acc, [key, value]) => [...acc, `${key}: ${value}`], [])
      .forEach((configLine) => logger.debug(configLine));
  },
};
