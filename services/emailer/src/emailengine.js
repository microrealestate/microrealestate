const formData = require('form-data');
const Mailgun = require('mailgun.js');
const config = require('./config');
const crypto = require('@mre/common/utils/crypto');

const sendEmail = (email, data) => {
  let mgConfig;
  if (data.landlord) {
    // email sent by an organization
    if (data.landlord.thirdParties && data.landlord.thirdParties.mailgun) {
      mgConfig = {
        apiKey: crypto.decrypt(data.landlord.thirdParties.mailgun.apiKey),
        domain: data.landlord.thirdParties.mailgun.domain,
      };
    }
  } else {
    // email sent by the application
    mgConfig = config.MAILGUN;
  }

  if (!mgConfig) {
    throw new Error('landlord has not set the mailgun configuration');
  }

  const mailgun = new Mailgun(formData);
  const mg = mailgun.client({ username: 'api', key: mgConfig.apiKey });
  return mg.messages.create(mgConfig.domain, email);
};

module.exports = {
  sendEmail,
};
