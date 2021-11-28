const nextTranslate = require('next-translate');

module.exports = nextTranslate({
  serverRuntimeConfig: {
    API_URL: process.env.DOCKER_API_URL || process.env.API_URL,
  },
  publicRuntimeConfig: {
    DEMO_MODE: process.env.DEMO_MODE === 'true',
    SIGNUP: process.env.SIGNUP === 'true',
    APP_NAME: process.env.APP_NAME,
    API_URL: process.env.API_URL,
    CORS_ENABLED: process.env.CORS_ENABLED === 'true',
    BASE_PATH: process.env.BASE_PATH || '',
  },
  basePath: process.env.BASE_PATH || '',
});
