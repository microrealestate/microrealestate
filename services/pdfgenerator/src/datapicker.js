const path = require('path');
const config = require('./config');

module.exports = async (templateId, params) => {
  const data = require(path.join(config.DATA_DIRECTORY, templateId));
  return await data.get(params);
};
