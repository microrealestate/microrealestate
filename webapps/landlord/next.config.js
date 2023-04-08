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
  basePath: process.env.BASE_PATH || '',
  productionBrowserSourceMaps: true,
});
