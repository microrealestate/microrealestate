const nextTranslate = require('next-translate-plugin');

const nextConfig = {
  experimental: {
    externalDir: true,
    appDir: false,
  },
  // base path cannot be set at runtime: https://github.com/vercel/next.js/discussions/41769
  basePath: process.env.BASE_PATH || '',
  productionBrowserSourceMaps: true,
};

module.exports = nextTranslate(nextConfig);
