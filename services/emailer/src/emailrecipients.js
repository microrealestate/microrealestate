const fs = require('fs');
const path = require('path');

module.exports = {
  build: async (locale, templateName, recordId, params, data) => {
    const recipientsPackagePath = path.join(
      __dirname,
      'emailparts',
      'recipients',
      templateName
    );
    if (!fs.existsSync(recipientsPackagePath)) {
      return [];
    }

    const recipients = require(recipientsPackagePath);
    return await recipients.get(recordId, params, data);
  },
};
