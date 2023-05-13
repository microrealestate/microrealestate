const formData = require('form-data');
const nodemailer = require('nodemailer');
const Mailgun = require('mailgun.js');
const config = require('./config');
const crypto = require('@microrealestate/common/utils/crypto');

async function _sendWithGmail(config, email) {
  const { replyTo, from, to, bcc, subject, text, html, attachment } = email;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // if true then port is 465, false for other ports
    auth: {
      user: config.email,
      pass: config.appPassword,
    },
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

async function _sendWithMailgun(config, email) {
  const mailgun = new Mailgun(formData);
  const mg = mailgun.client({ username: 'api', key: config.apiKey });
  return await mg.messages.create(config.domain, {
    ...email,
    'h:Reply-To': email.replyTo,
  });
}

function sendEmail(email, data) {
  // default config from env file
  let emailDeliveryServiceConfig;
  if (config.GMAIL) {
    emailDeliveryServiceConfig = {
      name: 'gmail',
      ...config.GMAIL,
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
        email: data.landlord.thirdParties.gmail.email,
        appPassword: crypto.decrypt(
          data.landlord.thirdParties.gmail.appPassword
        ),
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
      return _sendWithGmail(emailDeliveryServiceConfig, email);
    case 'mailgun':
      return _sendWithMailgun(emailDeliveryServiceConfig, email);
    default:
      throw new Error(`${emailDeliveryServiceConfig.name} is not supported`);
  }
}

module.exports = {
  sendEmail,
};
