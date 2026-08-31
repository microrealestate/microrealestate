import { Crypto } from '@microrealestate/common';
import nodemailer from 'nodemailer';

function _createTransport(config, extraOptions) {
  let auth;
  if (config.authentication) {
    auth = {
      user: config.username,
      pass: config.password
    };
  }

  return nodemailer.createTransport({
    host: config.server,
    port: config.port,
    secure: config.secure,
    ignoreTLS: config.ignoreTLS,
    auth,
    ...extraOptions
  });
}

function _toTlsOptions(encryption) {
  switch (encryption) {
    case 'tls':
      return { secure: true };
    case 'none':
      return { secure: false, ignoreTLS: true };
    default:
      return { secure: false };
  }
}

function _toLandlordConfig(smtp) {
  return {
    server: smtp.server,
    port: smtp.port,
    ..._toTlsOptions(smtp.encryption),
    authentication: smtp.authentication,
    username: smtp.authentication ? smtp.username : null,
    password: smtp.authentication ? Crypto.decrypt(smtp.password) : null
  };
}

async function _sendWithSmtp(config, email) {
  const { replyTo, from, to, bcc, subject, text, html, attachment } = email;

  const transporter = _createTransport(config);

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

export async function verifyConnection(smtp) {
  const transporter = _createTransport(_toLandlordConfig(smtp), {
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
  await transporter.verify();
}

export function sendEmail(email, data) {
  let emailDeliveryServiceConfig;
  // email service config from organization
  if (data.landlord?.thirdParties?.smtp?.server) {
    emailDeliveryServiceConfig = _toLandlordConfig(
      data.landlord.thirdParties.smtp
    );
  }

  if (!emailDeliveryServiceConfig) {
    throw new Error('the landlord email service has not been configured');
  }

  return _sendWithSmtp(emailDeliveryServiceConfig, email);
}
