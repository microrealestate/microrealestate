export const RENT_NOTICE_NAMES = [
  'rentnotice',
  'rentnotice_reminder',
  'rentnotice_last_reminder'
] as const;
export type RentNoticeName = (typeof RENT_NOTICE_NAMES)[number];

export const RENT_EMAIL_NAMES = ['receipt', ...RENT_NOTICE_NAMES] as const;
export type RentEmailName = (typeof RENT_EMAIL_NAMES)[number];

export const EMAIL_NAMES = [
  ...RENT_EMAIL_NAMES,
  'otp',
  'reset_password'
] as const;
export type EmailName = (typeof EMAIL_NAMES)[number];

export const EMAIL_STATUSES = ['sent', 'failed'] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];

export interface EmailType<Realm = string> {
  _id: string;
  realmId?: Realm;
  templateName: EmailName;
  recordId: string;
  params?: Record<string, unknown>;
  sentTo: string[];
  status?: EmailStatus;
  error?: string;
  /** Sortable date string YYYY-MM-DDTHH:mm. */
  sentDate?: string;
  emailId?: string;
}
