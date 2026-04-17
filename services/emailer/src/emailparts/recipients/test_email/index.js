export function get(email, params, data) {
  if (!email) {
    throw new Error('recipient email not found');
  }

  let emailDeliveryServiceConfig;

  if (data.landlord.thirdParties?.gmail?.selected) {
    emailDeliveryServiceConfig = data.landlord.thirdParties.gmail;
  }

  if (data.landlord.thirdParties?.exchange?.selected) {
    emailDeliveryServiceConfig = data.landlord.thirdParties.exchange;
  }

  if (data.landlord.thirdParties?.smtp?.selected) {
    emailDeliveryServiceConfig = data.landlord.thirdParties.smtp;
  }

  if (data.landlord.thirdParties?.mailgun?.selected) {
    emailDeliveryServiceConfig = data.landlord.thirdParties.mailgun;
  }

  if (!emailDeliveryServiceConfig) {
    throw new Error('landlord has not configured an email delivery service');
  }

  return [
    {
      to: email.toLowerCase(),
      from: emailDeliveryServiceConfig.fromEmail,
      replyTo: emailDeliveryServiceConfig.replyToEmail
    }
  ];
}
