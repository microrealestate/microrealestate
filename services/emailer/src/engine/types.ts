import type { API, AuthType, EmailName } from '@microrealestate/shared';

export interface RunContext {
  realmId: string;
  locale: string;
  currency: string;
  authorization: string;
}

export interface Envelope {
  to?: string[];
  bcc?: string[];
  from: string;
  replyTo?: string;
}

export interface Attachment {
  filename: string;
  content: Buffer;
}

/**
 * Who the email goes to and which SMTP it goes through, as one choice:
 *
 * - `landlord`: the tenant's contacts, through the organization's own SMTP. `data()` must return
 *   the `landlord` (realm) and the `tenant` contacts.
 * - `app`: one address, through the organization's own SMTP, for the emails that exist before
 *   any organization context does. `data()` must return the `email` and the `landlord` (realm).
 */
export type Sender = 'landlord' | 'app';

export const AUTH_BY_SENDER: Record<Sender, AuthType> = {
  landlord: 'accessToken',
  app: 'internalKey'
};

// Saved as is in the send log: keep secrets (otp, token) out of `params`
export interface EmailRef {
  recordId: string;
  params?: Record<string, unknown>;
}

export interface OnDemand<Ref extends EmailRef = EmailRef> {
  refsFromRequest(
    recordId: string,
    params: API.Emailer.PostSendEmail.SendEmailParams
  ): Promise<Ref[]>;
}

export interface EmailDefinition<
  Ref extends EmailRef = EmailRef,
  TemplateData = unknown
> {
  // The request's `templateName` and the template directory
  name: EmailName;

  sender: Sender;

  onDemand: OnDemand<Ref>;

  // The template data; `render()` adds only the helpers
  data(ref: Ref, ctx: RunContext): Promise<TemplateData>;

  attachments?(
    data: NoInfer<TemplateData>,
    ctx: RunContext
  ): Promise<Attachment[]>;
}

export interface SendResult {
  name: string;
  recipients: string[];
  emailId?: string;
  error?: string;
}

/**
 * Declares an email. Returns its argument unchanged: it exists so TypeScript infers `Ref` and
 * `TemplateData` from the slots, and no definition has to spell them out.
 */
export function defineEmail<Ref extends EmailRef, TemplateData>(
  definition: EmailDefinition<Ref, TemplateData>
): EmailDefinition<Ref, TemplateData> {
  return definition;
}
