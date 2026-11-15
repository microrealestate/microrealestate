const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
module.exports = withNextIntl({
  output: 'standalone',
  experimental: {
    externalDir: true
  },
  basePath: '/tenant',
  productionBrowserSourceMaps: true
});
