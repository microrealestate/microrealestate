const baseConfig = require('@mre/common/config');

module.exports = {
  ...baseConfig,
  PORT: process.env.PORT || 8900,
};
