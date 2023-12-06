const baseConfig = require('@microrealestate/common/config');

const DOMAIN_URL = new URL(process.env.DOMAIN_URL || 'http://localhost');

const config = {
  ...baseConfig,
  PORT: process.env.PORT || 8083,
  EMAILER_URL: process.env.EMAILER_URL || 'http://localhost:8083/emailer',
  SIGNUP: process.env.SIGNUP === 'true',
  DOMAIN_URL,
};

const TOKEN_COOKIE_ATTRIBUTES = {
  httpOnly: true,
  sameSite: 'strict',
  secure: DOMAIN_URL.protocol === 'https:',
  domain: DOMAIN_URL.hostname,
};

module.exports = { config, TOKEN_COOKIE_ATTRIBUTES };
