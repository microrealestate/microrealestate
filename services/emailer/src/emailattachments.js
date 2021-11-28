const fs = require('fs');
const path = require('path');

module.exports = {
  build: async (
    authorizationHeader,
    locale,
    organizationId,
    templateName,
    recordId,
    params,
    data
  ) => {
    const attachmentsPackagePath = path.join(
      __dirname,
      'emailparts',
      'attachments',
      templateName
    );
    if (!fs.existsSync(attachmentsPackagePath)) {
      return {
        attachment: [],
      };
    }

    const attachments = require(attachmentsPackagePath);
    return await attachments.get(
      authorizationHeader,
      locale,
      organizationId,
      recordId,
      params,
      data
    );
  },
};
