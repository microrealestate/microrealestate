const baseConfig = require('@microrealestate/common/config');

module.exports = {
  ...baseConfig,
  PORT: process.env.PORT || 8080,
  EXPOSE_FRONTENDS: process.env.EXPOSE_FRONTENDS === 'true',
  AUTHENTICATOR_PORT: process.env.AUTHENTICATOR_PORT,
  API_PORT: process.env.API_PORT,
  PDFGENERATOR_PORT: process.env.PDFGENERATOR_PORT,
  RESETSERVICE_PORT: process.env.RESETSERVICE_PORT,
  LANDLORD_FRONTEND_PORT: process.env.LANDLORD_FRONTEND_PORT,
  LANDLORD_BASE_PATH: process.env.LANDLORD_BASE_PATH,
  TENANT_FRONTEND_PORT: process.env.TENANT_FRONTEND_PORT,
  TENANT_BASE_PATH: process.env.TENANT_BASE_PATH,
  DOMAIN_URL: process.env.DOMAIN_URL || 'http://localhost',
  CORS_ENABLED: process.env.CORS_ENABLED === 'true',
};
