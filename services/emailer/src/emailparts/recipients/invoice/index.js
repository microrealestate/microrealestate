const config = require('../../../config');

module.exports = {
  get: (recordId, params, data) => {
    if (!data.tenant && !data.tenant.contacts) {
      throw new Error('tenant has not any contact emails');
    }

    if (!data.landlord.thirdParties || !data.landlord.thirdParties.mailgun) {
      throw new Error('landlord has not set the mailgun configuration');
    }

    const fromEmail = data.landlord.thirdParties.mailgun.fromEmail;
    const replyToEmail = data.landlord.thirdParties.mailgun.replyToEmail;

    const recipientsList = data.tenant.contacts
      .filter((contact) => contact.email)
      .reduce((acc, { email }) => {
        if (acc.find(({ to }) => to === email.toLowerCase())) {
          return acc;
        }
        let recipients = {
          from: fromEmail,
          to: email.toLowerCase(),
          'h:Reply-To': replyToEmail,
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
