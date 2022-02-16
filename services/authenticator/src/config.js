const baseConfig = require('@mre/common/config');

module.exports = {
  ...baseConfig,
  PRODUCTION: process.env.NODE_ENV === 'production',
  PORT: process.env.PORT || 8083,
  EMAILER_URL: process.env.EMAILER_URL || 'http://localhost:8083/emailer',
  SIGNUP: process.env.SIGNUP === 'true',
  APP_URL: process.env.APP_URL || 'http://localhost/app',
};
