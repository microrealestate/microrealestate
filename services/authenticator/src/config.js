const baseConfig = require('@microrealestate/common/config');

module.exports = {
  ...baseConfig,
  PORT: process.env.PORT || 8083,
  EMAILER_URL: process.env.EMAILER_URL || 'http://localhost:8083/emailer',
  SIGNUP: process.env.SIGNUP === 'true',
  DOMAIN_URL: process.env.DOMAIN_URL || 'http://localhost',
};
