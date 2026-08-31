const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

function readVersionFile() {
  try {
    return require('../../version.json');
  } catch {
    console.warn(
      'version.json not found at the repository root: the version badge falls back to the runtime MRE_VERSION, or hides itself'
    );
    return {};
  }
}

const versionFile = readVersionFile();

module.exports = withNextIntl({
  env: {
    NEXT_PUBLIC_GIT_SHA: versionFile.sha || 'dev',
    NEXT_PUBLIC_APP_VERSION: versionFile.version || ''
  },
  output: 'standalone',
  experimental: {
    externalDir: true
  },
  webpack: (
    config /*,
    {
     buildId, dev, isServer, defaultLoaders,  webpack 
    }
    */
  ) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  basePath: '/landlord',
  productionBrowserSourceMaps: true
});
