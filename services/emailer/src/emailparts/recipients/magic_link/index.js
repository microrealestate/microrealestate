const config = require('../../../config');

module.exports = {
  get: (email /*, params, data*/) => {
    if (!email) {
      throw new Error('recipient email not found');
    }

    let emailDeliveryServiceConfig;
    if (config.GMAIL) {
      emailDeliveryServiceConfig = config.GMAIL;
    } else if (config.MAILGUN) {
      emailDeliveryServiceConfig = config.MAILGUN;
    } else if (config.SMTP) {
      emailDeliveryServiceConfig = config.SMTP;
    }

    if (!emailDeliveryServiceConfig) {
      throw new Error('the app email service has not been configured');
    }

    return [
      {
        to: email.toLowerCase(),
        from: emailDeliveryServiceConfig.fromEmail,
        replyTo: emailDeliveryServiceConfig.replyToEmail,
        bcc: emailDeliveryServiceConfig.bccEmails,
      },
    ];
  },
};
