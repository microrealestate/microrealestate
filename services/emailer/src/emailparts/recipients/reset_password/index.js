const config = require('../../../config');

module.exports = {
  get: (email /*, params, data*/) => {
    if (!email) {
      throw new Error('recipient email not found');
    }

    return [
      {
        to: email.toLowerCase(),
        from: config.EMAIL.FROM,
      },
    ];
  },
};
