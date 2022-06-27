const nextTranslate = require('next-translate');
const path = require('path');

module.exports = nextTranslate({
  webpack: (config /*{ buildId, dev, isServer, defaultLoaders, webpack }*/) => {
    config.resolve.alias['pdfjs-dist'] = path.join(
      __dirname,
      '../../node_modules/pdfjs-dist/legacy/build/pdf'
    );
    return config;
  },
  serverRuntimeConfig: {
    APP_URL: process.env.APP_URL,
    API_URL: process.env.DOCKER_API_URL || process.env.API_URL,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  },
  publicRuntimeConfig: {
    DEMO_MODE: process.env.DEMO_MODE === 'true',
    SIGNUP: process.env.SIGNUP === 'true',
    APP_NAME: process.env.APP_NAME,
    APP_URL: process.env.APP_URL,
    API_URL: process.env.API_URL,
    CORS_ENABLED: process.env.CORS_ENABLED === 'true',
    BASE_PATH: process.env.BASE_PATH || '',
  },
  basePath: process.env.BASE_PATH || '',
});
