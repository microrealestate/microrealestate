/** @type {import('next').NextConfig} */
const nextTranslate = require('next-translate-plugin');

const nextConfig = {
  experimental: {
    externalDir: true,
    appDir: true,
  },
  reactStrictMode: false, // true breaks the MaterialUI SSR
  swcMinify: false,
  basePath: process.env.BASE_PATH || '',
  productionBrowserSourceMaps: true,
};

module.exports = nextTranslate(nextConfig);
