const path = require('node:path');
const {
  generateLocaleStrings
} = require('../../commonui/scripts/extract-localized-strings.cjs');

generateLocaleStrings({ appDir: path.resolve(__dirname, '..') });
