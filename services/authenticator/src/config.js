module.exports = {
  LOGGER_LEVEL: process.env.LOGGER_LEVEL || 'debug',
  PRODUCTION: process.env.NODE_ENV === 'production',
  PORT: process.env.PORT || 8083,
  EMAILER_URL: process.env.EMAILER_URL || 'http://localhost:8083/emailer',
  TOKEN_DB_URL:
    process.env.REDIS_URL ||
    process.env.TOKEN_DB_URL ||
    'redis://localhost:6379',
  TOKEN_DB_PASSWORD: process.env.TOKEN_DB_PASSWORD || undefined,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'access_token_secret',
  REFRESH_TOKEN_SECRET:
    process.env.REFRESH_TOKEN_SECRET || 'refresh_token_secret',
  RESET_TOKEN_SECRET: process.env.RESET_TOKEN_SECRET || 'reset_token_secret',
  BASE_DB_URL:
    process.env.MONGO_URL ||
    process.env.BASE_DB_URL ||
    'mongodb://localhost/sampledb',
  SIGNUP: process.env.SIGNUP === 'true',
  DOMAIN: process.env.DOMAIN || 'localhost',
};
