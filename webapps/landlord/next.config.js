const path = require('path');
const nextTranslate = require('next-translate-plugin');

module.exports = nextTranslate({
  experimental: {
    externalDir: true,
    appDir: false,
  },
  webpack: (
    config /*,
    {
     buildId, dev, isServer, defaultLoaders,  webpack 
    }
    */
  ) => {
    config.resolve.alias['pdfjs-dist'] = path.join(
      __dirname,
      '../../node_modules/pdfjs-dist/legacy/build/pdf'
    );

    return config;
  },
  // base path cannot be set at runtime: https://github.com/vercel/next.js/discussions/41769
  basePath: process.env.BASE_PATH || '',
  productionBrowserSourceMaps: true,
});
