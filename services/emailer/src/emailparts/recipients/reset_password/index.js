export function get(email, _params, data) {
  if (!email) {
    throw new Error('recipient email not found');
  }

  if (!data.landlord.thirdParties?.smtp?.server) {
    throw new Error('the email delivery service has not been configured');
  }
  const emailDeliveryService = data.landlord.thirdParties.smtp;

  return [
    {
      to: email.toLowerCase(),
      from: emailDeliveryService.fromEmail
    }
  ];
}
