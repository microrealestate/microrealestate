const config = require('../config');

module.exports = {
  computeRent: require(`./${config.businesslogic}/computeRent`),
};
