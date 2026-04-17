import { Crypto, Service } from '@microrealestate/common';
import axios from 'axios';
import mailgun from 'nodemailer-mailgun-transport';
import nodemailer from 'nodemailer';

async function _sendWithGraph(config, email) {
  const {
    replyTo,
    from,
    to,
    bcc,
    subject,
    text,
    html,
    attachment = []
  } = email;

  const tokenParams = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: 'https://graph.microsoft.com/.default'
  });

  let tokenResponse;
  try {
    tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
      tokenParams.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
  } catch (error) {
    const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    throw new Error(`Graph token error: ${errorMsg}`);
  }

  const accessToken = tokenResponse.data?.access_token;
  if (!accessToken) {
    throw new Error('unable to retrieve Microsoft Graph access token');
  }

  const toRecipients = String(to || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((address) => ({
      emailAddress: {
        address
      }
    }));

  const bccRecipients = String(bcc || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((address) => ({
      emailAddress: {
        address
      }
    }));

  const replyToRecipients = String(replyTo || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((address) => ({
      emailAddress: {
        address
      }
    }));

  const attachments = attachment.map(({ filename, data, mimeType }) => {
    const contentBuffer = Buffer.isBuffer(data)
      ? data
      : Buffer.from(data || '', 'binary');
    return {
      '@odata.type': '#microsoft.graph.fileAttachment',
      name: filename,
      contentType: mimeType || 'application/octet-stream',
      contentBytes: contentBuffer.toString('base64')
    };
  });

  const payload = {
    message: {
      subject,
      from: {
        emailAddress: {
          address: String(from || config.fromEmail || config.senderEmail || '')
        }
      },
      body: {
        contentType: html ? 'HTML' : 'Text',
        content: html || text || ''
      },
      toRecipients,
      bccRecipients,
      replyTo: replyToRecipients,
      attachments
    },
    saveToSentItems: true
  };

  let graphResponse;
  try {
    graphResponse = await axios.post(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.senderEmail)}/sendMail`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    const errorData = error.response?.data || error.message;
    const errorStatus = error.response?.status || 'unknown';
    throw new Error(`Graph sendMail error (${errorStatus}): ${JSON.stringify(errorData)}`);
  }

  return {
    id:
      graphResponse.headers['request-id'] ||
      graphResponse.headers['x-ms-ags-diagnostic'] ||
      '<graph-sendmail-accepted>',
    message: `Graph sendMail accepted with status ${graphResponse.status}`
  };
}

async function _sendWithMailgun(config, email) {
  const { replyTo, from, to, bcc, subject, text, html, attachment } = email;
  const auth = {
    auth: {
      api_key: config.apiKey,
      domain: config.domain
    }
  };

  const transporter = nodemailer.createTransport(mailgun(auth));

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
    port: config.port,
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
    if (data.landlord.thirdParties?.graph?.selected) {
      emailDeliveryServiceConfig = {
        name: 'graph',
        tenantId: data.landlord.thirdParties.graph.tenantId,
        clientId: data.landlord.thirdParties.graph.clientId,
        clientSecret: Crypto.decrypt(data.landlord.thirdParties.graph.clientSecret),
        senderEmail: data.landlord.thirdParties.graph.senderEmail,
        fromEmail: data.landlord.thirdParties.graph.fromEmail,
        replyToEmail: data.landlord.thirdParties.graph.replyToEmail
      };
    }
    if (data.landlord.thirdParties?.exchange?.selected) {
      emailDeliveryServiceConfig = {
        name: 'exchange',
        server: data.landlord.thirdParties.exchange.server,
        port: data.landlord.thirdParties.exchange.port,
        secure: data.landlord.thirdParties.exchange.secure,
        authentication: data.landlord.thirdParties.exchange.authentication,
        username: data.landlord.thirdParties.exchange.authentication
          ? data.landlord.thirdParties.exchange.username
          : null,
        password: data.landlord.thirdParties.exchange.authentication
          ? Crypto.decrypt(data.landlord.thirdParties.exchange.password)
          : null
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
    case 'exchange':
      return _sendWithSmtp(emailDeliveryServiceConfig, email);
    case 'graph':
      return _sendWithGraph(emailDeliveryServiceConfig, email);
    case 'mailgun':
      return _sendWithMailgun(emailDeliveryServiceConfig, email);
    default:
      throw new Error(`${emailDeliveryServiceConfig.name} is not supported`);
  }
}
