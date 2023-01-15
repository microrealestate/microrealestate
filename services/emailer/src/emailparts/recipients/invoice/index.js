const config = require('../../../config');

module.exports = {
  get: (recordId, params, data) => {
    if (!data.tenant && !data.tenant.contacts) {
      throw new Error('tenant has not any contact emails');
    }

    let emailDeliveryServiceConfig;
    if (data.landlord.thirdParties?.gmail?.selected) {
      emailDeliveryServiceConfig = data.landlord.thirdParties.gmail;
    }

    if (data.landlord.thirdParties?.mailgun?.selected) {
      emailDeliveryServiceConfig = data.landlord.thirdParties.mailgun;
    }

    if (!emailDeliveryServiceConfig) {
      throw new Error('landlord has not configured an email delivery service');
    }

    const fromEmail = emailDeliveryServiceConfig.fromEmail;
    const replyToEmail = emailDeliveryServiceConfig.replyToEmail;

    const recipientsList = data.tenant.contacts
      .filter((contact) => contact.email)
      .reduce((acc, { email }) => {
        if (acc.find(({ to }) => to === email.toLowerCase())) {
          return acc;
        }
        let recipients = {
          from: fromEmail,
          to: email.toLowerCase(),
          replyTo: replyToEmail,
        };
        if (config.PRODUCTIVE && data.landlord.members.length) {
          recipients = {
            ...recipients,
            bcc: data.landlord.members
              .filter(
                ({ email, registered }) => registered && email !== fromEmail
              )
              .map(({ email }) => email)
              .join(','),
          };
        }
        acc.push(recipients);
        return acc;
      }, []);

    if (!recipientsList || !recipientsList.length) {
      throw new Error('tenant has not any contact emails');
    }

    return recipientsList;
  },
};
