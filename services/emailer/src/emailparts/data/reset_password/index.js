const Account = require('@mre/common/models/account');

module.exports = {
  get: async (email, params) => {
    const dbAccount = await Account.findOne({ email });
    if (!dbAccount) {
      throw new Error('user not found');
    }

    const account = dbAccount.toObject();

    // data that will be injected in the email content files (ejs files)
    return {
      firstname: account.firstname,
      token: params.token,
    };
  },
};
