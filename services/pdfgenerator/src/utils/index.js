const path = require('path');

const sfn = require('sanitize-filename');

module.exports = {
  sanitize: (name = '') => {
    return sfn(name, { replacement: '_' });
  },

  sanitizePath: (filePath = '') => {
    return filePath
      ?.split(path.sep)
      .map((element) => sfn(element, { replacement: '_' }))
      .join(path.sep);
  },
};
