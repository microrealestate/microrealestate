const mailgun = require('mailgun-js');
const config = require('./config');
const crypto = require('./utils/crypto');

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

  const mg = mailgun(mgConfig);

  return new Promise((resolve, reject) => {
    mg.messages().send(email, function (error, body) {
      if (error) {
        return reject(error);
      }
      resolve(body);
    });
  });
};

module.exports = {
  sendEmail,
};
