const baseConfig = require('@microrealestate/common/config');

module.exports = {
  ...baseConfig,
  PORT: process.env.PORT || 8080,
  EXPOSE_FRONTENDS: process.env.EXPOSE_FRONTENDS === 'true',
  AUTHENTICATOR_URL: process.env.AUTHENTICATOR_URL,
  API_URL: process.env.API_URL,
  PDFGENERATOR_URL: process.env.PDFGENERATOR_URL,
  RESETSERVICE_URL: process.env.RESETSERVICE_URL,
  LANDLORD_FRONTEND_PORT: process.env.LANDLORD_FRONTEND_PORT,
  LANDLORD_BASE_PATH: process.env.LANDLORD_BASE_PATH,
  TENANT_FRONTEND_PORT: process.env.TENANT_FRONTEND_PORT,
  TENANT_BASE_PATH: process.env.TENANT_BASE_PATH,
  DOMAIN_URL: process.env.DOMAIN_URL || 'http://localhost',
  CORS_ENABLED: process.env.CORS_ENABLED === 'true',
};
