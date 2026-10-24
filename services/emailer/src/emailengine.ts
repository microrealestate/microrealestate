import { Crypto } from '@microrealestate/common';
import type { RealmType } from '@microrealestate/shared';
import nodemailer from 'nodemailer';
import type { Attachment, Envelope } from './engine/types';
import { assertAllowedDestination } from './smtpdestination';

/** An SMTP configuration resolved down to what nodemailer needs. */
export interface TransportConfig {
  server?: string;
  port?: number;
  secure?: boolean;
  ignoreTLS?: boolean;
  requireTLS?: boolean;
  authentication?: boolean;
  username?: string | null;
  password?: string | null;
  /** Envelope defaults that come with the configuration rather than with the email. */
  fromEmail?: string;
  replyToEmail?: string;
}

export interface OutgoingEmail {
  envelope: Envelope;
  subject: string;
  text: string;
  html: string;
  attachments: Attachment[];
}

type RealmSmtp = NonNullable<RealmType['thirdParties']>['smtp'];

async function _createTransport(
  config: TransportConfig,
  extraOptions?: Record<string, unknown>
) {
  await assertAllowedDestination(config.server ?? '', Number(config.port));

  const auth = config.authentication
    ? { user: config.username ?? undefined, pass: config.password ?? undefined }
    : undefined;

  return nodemailer.createTransport({
    host: config.server,
    port: config.port,
    secure: config.secure,
    ignoreTLS: config.ignoreTLS,
    requireTLS: config.requireTLS,
    auth,
    ...extraOptions
  });
}

function _toTlsOptions(encryption?: string) {
  switch (encryption) {
    case 'tls':
      return { secure: true };
    case 'none':
      return { secure: false, ignoreTLS: true };
    case 'starttls':
      return { secure: false, requireTLS: true };
    default:
      return { secure: false };
  }
}

export function toLandlordConfig(smtp: RealmSmtp): TransportConfig {
  return {
    server: smtp?.server,
    port: smtp?.port,
    ..._toTlsOptions(smtp?.encryption),
    authentication: smtp?.authentication,
    username: smtp?.authentication ? smtp?.username : null,
    password:
      smtp?.authentication && smtp?.password
        ? Crypto.decrypt(smtp.password)
        : null,
    fromEmail: smtp?.fromEmail,
    replyToEmail: smtp?.replyToEmail
  };
}

/**
 * Nodemailer's own defaults are 120 s to connect, 30 s for the greeting and 600 s of socket
 * silence.
 */
const CONNECT_TIMEOUTS = {
  connectionTimeout: 10000,
  greetingTimeout: 10000
};

export async function verifyConnection(smtp: RealmSmtp): Promise<void> {
  const transporter = await _createTransport(toLandlordConfig(smtp), {
    ...CONNECT_TIMEOUTS,
    socketTimeout: 10000
  });
  await transporter.verify();
}

export async function sendEmail(
  email: OutgoingEmail,
  config: TransportConfig
): Promise<{ id: string; message?: string }> {
  const { envelope, subject, text, html, attachments } = email;

  const transporter = await _createTransport(config, {
    ...CONNECT_TIMEOUTS,
    socketTimeout: 60000
  });

  const result = await transporter.sendMail({
    from: envelope.from,
    replyTo: envelope.replyTo,
    to: envelope.to,
    bcc: envelope.bcc,
    subject,
    text,
    html,
    attachments: attachments.map(({ filename, content }) => ({
      filename,
      content
    }))
  });

  return {
    id: result.messageId,
    message: result.response
  };
}
