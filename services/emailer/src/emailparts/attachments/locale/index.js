const path = require('path');

module.exports = (locale) => {
  return require(path.join(__dirname, `${locale}.json`));
};
