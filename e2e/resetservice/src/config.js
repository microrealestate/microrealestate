module.exports = {
  LOGGER_LEVEL: process.env.LOGGER_LEVEL || 'debug',
  PORT: process.env.PORT || 8900,
  MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost/sampledb',
  TOKEN_DB_URL: process.env.TOKEN_DB_URL || 'redis://localhost:6379',
  TOKEN_DB_PASSWORD: process.env.TOKEN_DB_PASSWORD || undefined,
};
