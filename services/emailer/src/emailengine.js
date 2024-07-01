// eslint-disable-next-line import/no-unresolved
import { Crypto, Service } from '@microrealestate/common';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import nodemailer from 'nodemailer';

async function _sendWithMailgun(config, email) {
  const mailgun = new Mailgun(formData);
  const mg = mailgun.client({ username: 'api', key: config.apiKey });
  return await mg.messages.create(config.domain, {
    ...email,
    'h:Reply-To': email.replyTo
  });
}

async function _sendWithSmtp(config, email) {
  const { replyTo, from, to, bcc, subject, text, html, attachment } = email;

  let auth;
  if (config.authentication) {
    auth = {
      user: config.username,
      pass: config.password
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.server,
    port: config.ports,
    secure: config.secure,
    auth
  });

  const result = await transporter.sendMail({
    from,
    replyTo,
    to,
    bcc,
    subject,
    text,
    html,
    attachments: attachment.map(({ filename, data }) => ({
      filename,
      content: data
    }))
  });

  return {
    id: result.messageId,
    message: result.response
  };
}

export function sendEmail(email, data) {
  const { GMAIL, SMTP, MAILGUN } = Service.getInstance().envConfig.getValues();
  let emailDeliveryServiceConfig;
  // email service config from env file
  if (data.useAppEmailService) {
    if (GMAIL) {
      emailDeliveryServiceConfig = {
        name: 'gmail',
        server: 'smtp.gmail.com',
        port: 587,
        secure: false, // if true then port is 465, false for other ports
        authentication: true,
        username: GMAIL.email,
        password: GMAIL.appPassword
      };
    }
    if (SMTP) {
      emailDeliveryServiceConfig = {
        name: 'smtp',
        ...SMTP
      };
    }
    if (MAILGUN) {
      emailDeliveryServiceConfig = {
        name: 'mailgun',
        ...MAILGUN
      };
    }
  }
  // email service config from organization
  else if (data.landlord) {
    if (data.landlord.thirdParties?.gmail?.selected) {
      emailDeliveryServiceConfig = {
        name: 'gmail',
        server: 'smtp.gmail.com',
        port: 587,
        secure: false, // if true then port is 465, false for other ports
        authentication: true,
        username: data.landlord.thirdParties.gmail.email,
        password: Crypto.decrypt(data.landlord.thirdParties.gmail.appPassword)
      };
    }
    if (data.landlord.thirdParties?.smtp?.selected) {
      emailDeliveryServiceConfig = {
        name: 'smtp',
        server: data.landlord.thirdParties.smtp.server,
        port: data.landlord.thirdParties.smtp.port,
        secure: data.landlord.thirdParties.smtp.secure,
        authentication: data.landlord.thirdParties.smtp.authentication,
        username: data.landlord.thirdParties.smtp.authentication
          ? data.landlord.thirdParties.smtp.username
          : null,
        password: data.landlord.thirdParties.smtp.authentication
          ? Crypto.decrypt(data.landlord.thirdParties.smtp.password)
          : null
      };
    }
    if (data.landlord.thirdParties?.mailgun?.selected) {
      emailDeliveryServiceConfig = {
        name: 'mailgun',
        apiKey: Crypto.decrypt(data.landlord.thirdParties.mailgun.apiKey),
        domain: data.landlord.thirdParties.mailgun.domain
      };
    }
  }

  if (!emailDeliveryServiceConfig) {
    if (data.useAppEmailService) {
      throw new Error('the app email service has not been configured');
    } else {
      throw new Error('the landlord email service has not been configured');
    }
  }

  switch (emailDeliveryServiceConfig.name) {
    case 'gmail':
    case 'smtp':
      return _sendWithSmtp(emailDeliveryServiceConfig, email);
    case 'mailgun':
      return _sendWithMailgun(emailDeliveryServiceConfig, email);
    default:
      throw new Error(`${emailDeliveryServiceConfig.name} is not supported`);
  }
}
