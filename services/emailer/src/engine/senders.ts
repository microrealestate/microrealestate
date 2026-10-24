import { Service } from '@microrealestate/common';
import type { RealmType } from '@microrealestate/shared';
import { type TransportConfig, toLandlordConfig } from '../emailengine';
import type { LandlordData } from '../emails/shared/landlord';
import type { Envelope, Sender } from './types';

// What each sender reads off the definition's `data()`
interface LandlordSenderData {
  landlord: LandlordData;
  tenant: { contacts?: { email?: string }[] };
}

interface AppSenderData {
  email: string;
  landlord: RealmType;
}

export function envelopeFor(sender: Sender, data: unknown): Envelope {
  return sender === 'landlord'
    ? tenantContactEnvelope(data as LandlordSenderData)
    : appEnvelope(data as AppSenderData);
}

// There is no app-level SMTP: both senders go through the organization's own
export function transportFor(_sender: Sender, data: unknown): TransportConfig {
  return landlordTransport(data as { landlord: RealmType });
}

function tenantContactEnvelope(data: LandlordSenderData): Envelope {
  const { PRODUCTION } = Service.getInstance().envConfig.getValues();
  const smtp = data.landlord.thirdParties?.smtp;
  if (!smtp?.server) {
    throw new Error('landlord has not configured an email delivery service');
  }

  const to = [
    ...new Set(
      (data.tenant.contacts ?? [])
        .map(({ email }) => email?.toLowerCase())
        .filter((email): email is string => !!email)
    )
  ];
  if (!to.length) {
    throw new Error('tenant has not any contact emails');
  }

  const fromEmail = smtp.fromEmail ?? '';
  const bcc =
    PRODUCTION && data.landlord.members?.length
      ? data.landlord.members
          .filter(({ email }) => email !== fromEmail)
          .map(({ email }) => email)
      : [];

  return {
    to,
    from: fromEmail,
    replyTo: smtp.replyToEmail,
    ...(bcc.length ? { bcc } : {})
  };
}

function appEnvelope({ email, landlord }: AppSenderData): Envelope {
  if (!email) {
    throw new Error('recipient email not found');
  }

  const smtp = landlord.thirdParties?.smtp;
  if (!smtp?.server) {
    throw new Error('the email delivery service has not been configured');
  }

  return {
    to: [email.toLowerCase()],
    from: smtp.fromEmail ?? '',
    replyTo: smtp.replyToEmail
  };
}

// The organization's own SMTP, read off the landlord `data()` already loaded
function landlordTransport(data: { landlord: RealmType }): TransportConfig {
  const smtp = data.landlord.thirdParties?.smtp;
  if (!smtp?.server) {
    throw new Error('the landlord email service has not been configured');
  }
  return toLandlordConfig(smtp);
}
