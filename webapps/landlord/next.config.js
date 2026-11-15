const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

function readVersionFile() {
  try {
    return require('../../version.json');
  } catch {
    console.warn(
      'version.json not found at the repository root: the About dialog hides the version and the update features are off'
    );
    return {};
  }
}

const versionFile = readVersionFile();

module.exports = withNextIntl({
  env: {
    NEXT_PUBLIC_GIT_SHA: versionFile.sha || 'dev',
    NEXT_PUBLIC_RELEASE_VERSION: versionFile.release || '',
    BUILD_DATE: versionFile.date || ''
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
