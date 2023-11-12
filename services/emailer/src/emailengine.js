const formData = require('form-data');
const nodemailer = require('nodemailer');
const Mailgun = require('mailgun.js');
const config = require('./config');
const crypto = require('@microrealestate/common/utils/crypto');

async function _sendWithMailgun(config, email) {
  const mailgun = new Mailgun(formData);
  const mg = mailgun.client({ username: 'api', key: config.apiKey });
  return await mg.messages.create(config.domain, {
    ...email,
    'h:Reply-To': email.replyTo,
  });
}

async function _sendWithSmtp(config, email) {
  const { replyTo, from, to, bcc, subject, text, html, attachment } = email;

  var auth = undefined;
  if (config.authentication) {
    auth = {
      user: config.username,
      pass: config.password,
    }
  }

  const transporter = nodemailer.createTransport({
    host: config.server,
    port: config.ports,
    secure: config.secure,
    auth: auth,
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
      content: data,
    })),
  });

  return {
    id: result.messageId,
    message: result.response,
  };
}

function sendEmail(email, data) {
  // default config from env file
  let emailDeliveryServiceConfig;
  if (config.GMAIL) {
    emailDeliveryServiceConfig = {
      name: 'gmail',
      server: 'smtp.gmail.com',
      port: 587,
      secure: false, // if true then port is 465, false for other ports
      authentication: true,
      username: config.GMAIL.email,
      password: config.GMAIL.appPassword,
    };
  }
  if (config.SMTP) {
    emailDeliveryServiceConfig = {
      name: 'smtp',
      ...config.SMTP,
    };
  }
  if (config.MAILGUN) {
    emailDeliveryServiceConfig = {
      name: 'mailgun',
      ...config.MAILGUN,
    };
  }

  // config from organization
  if (data.landlord) {
    if (data.landlord.thirdParties?.gmail?.selected) {
      emailDeliveryServiceConfig = {
        name: 'gmail',
        server: 'smtp.gmail.com',
        port: 587,
        secure: false, // if true then port is 465, false for other ports
        authentication: true,
        username: data.landlord.thirdParties.gmail.email,
        password: crypto.decrypt(
          data.landlord.thirdParties.gmail.appPassword
        ),
      };
    }
    if (data.landlord.thirdParties?.smtp?.selected) {
      emailDeliveryServiceConfig = {
        name: 'smtp',
        server: data.landlord.thirdParties.smtp.server,
        port: data.landlord.thirdParties.smtp.port,
        secure: data.landlord.thirdParties.smtp.secure,
        authentication: data.landlord.thirdParties.smtp.authentication,
        username:  data.landlord.thirdParties.smtp.authentication ?
          data.landlord.thirdParties.smtp.username
          : null,
        password: data.landlord.thirdParties.smtp.authentication ?
          crypto.decrypt(data.landlord.thirdParties.smtp.password)
          : null,
      };
    }
    if (data.landlord.thirdParties?.mailgun?.selected) {
      emailDeliveryServiceConfig = {
        name: 'mailgun',
        apiKey: crypto.decrypt(data.landlord.thirdParties.mailgun.apiKey),
        domain: data.landlord.thirdParties.mailgun.domain,
      };
    }
  }

  if (!emailDeliveryServiceConfig) {
    throw new Error('landlord has not configured the email delivery service');
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

module.exports = {
  sendEmail,
};
