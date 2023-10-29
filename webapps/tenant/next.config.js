/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
  },
  basePath: process.env.BASE_PATH || '',
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig;
