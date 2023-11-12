/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    externalDir: true,
  },
  basePath: process.env.BASE_PATH || '',
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig;
