const path = require('path');
const nextTranslate = require('next-translate-plugin');

module.exports = nextTranslate({
  experimental: {
    externalDir: true,
    appDir: true,
  },
  webpack: (config /*{ buildId, dev, isServer, defaultLoaders, webpack }*/) => {
    config.resolve.alias['pdfjs-dist'] = path.join(
      __dirname,
      '../../node_modules/pdfjs-dist/legacy/build/pdf'
    );
    return config;
  },
  serverRuntimeConfig: {
    APP_URL: process.env.APP_URL,
    GATEWAY_URL: process.env.DOCKER_GATEWAY_URL || process.env.GATEWAY_URL,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  },
  publicRuntimeConfig: {
    DEMO_MODE: process.env.DEMO_MODE === 'true',
    SIGNUP: process.env.SIGNUP === 'true',
    APP_NAME: process.env.APP_NAME,
    APP_URL: process.env.APP_URL,
    GATEWAY_URL: process.env.GATEWAY_URL,
    CORS_ENABLED: process.env.CORS_ENABLED === 'true',
    BASE_PATH: process.env.BASE_PATH || '',
  },
  basePath: process.env.BASE_PATH || '',
});
