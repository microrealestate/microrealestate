/** @type {import('next').NextConfig} */
const nextTranslate = require('next-translate-plugin');

const nextConfig = {
  experimental: {
    externalDir: true,
    appDir: true,
  },
  reactStrictMode: false, // true breaks the MaterialUI SSR
  swcMinify: false,
  serverRuntimeConfig: {
    APP_URL: process.env.APP_URL,
    API_URL: process.env.DOCKER_API_URL || process.env.API_URL,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  },
  publicRuntimeConfig: {
    DEMO_MODE: process.env.DEMO_MODE === 'true',
    APP_NAME: process.env.APP_NAME,
    APP_URL: process.env.APP_URL,
    API_URL: process.env.API_URL,
    CORS_ENABLED: process.env.CORS_ENABLED === 'true',
    BASE_PATH: process.env.BASE_PATH || '',
  },
  basePath: process.env.BASE_PATH || '',
};

module.exports = nextTranslate(nextConfig);
