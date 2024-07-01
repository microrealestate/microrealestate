// eslint-disable-next-line import/no-unresolved
import { Service } from '@microrealestate/common';

export function get(email /*, params, data*/) {
  if (!email) {
    throw new Error('recipient email not found');
  }

  const { GMAIL, MAILGUN, SMTP } = Service.getInstance().envConfig.getValues();
  let emailDeliveryServiceConfig;
  if (GMAIL) {
    emailDeliveryServiceConfig = GMAIL;
  } else if (MAILGUN) {
    emailDeliveryServiceConfig = MAILGUN;
  } else if (SMTP) {
    emailDeliveryServiceConfig = SMTP;
  }

  if (!emailDeliveryServiceConfig) {
    throw new Error('the app email service has not been configured');
  }

  return [
    {
      to: email.toLowerCase(),
      from: emailDeliveryServiceConfig.fromEmail
    }
  ];
}
