import { Service } from '@microrealestate/common';

export function get(_recordId, _params, data) {
  if (!(data.tenant || data.tenant.contacts)) {
    throw new Error('tenant has not any contact emails');
  }

  if (!data.landlord.thirdParties?.smtp?.server) {
    throw new Error('landlord has not configured an email delivery service');
  }
  const emailDeliveryService = data.landlord.thirdParties.smtp;

  const { PRODUCTION } = Service.getInstance().envConfig.getValues();
  const fromEmail = emailDeliveryService.fromEmail;
  const replyToEmail = emailDeliveryService.replyToEmail;

  const recipientsList = data.tenant.contacts
    .filter((contact) => contact.email)
    .reduce((acc, { email }) => {
      if (acc.find(({ to }) => to === email.toLowerCase())) {
        return acc;
      }
      let recipients = {
        from: fromEmail,
        to: email.toLowerCase(),
        replyTo: replyToEmail
      };
      if (PRODUCTION && data.landlord.members.length) {
        recipients = {
          ...recipients,
          bcc: data.landlord.members
            .filter(({ email }) => email !== fromEmail)
            .map(({ email }) => email)
            .join(',')
        };
      }
      acc.push(recipients);
      return acc;
    }, []);

  if (!recipientsList?.length) {
    throw new Error('tenant has not any contact emails');
  }

  return recipientsList;
}
