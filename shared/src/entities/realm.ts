import type { Address, BankInfo, CompanyInfo, Contact } from '../common';

export const LOCALES = ['de-DE', 'en', 'fr-FR', 'pt-BR', 'es-CO'] as const;
export type Locale = (typeof LOCALES)[number];

export const SMTP_ENCRYPTIONS = ['none', 'starttls', 'tls'] as const;
export type SmtpEncryption = (typeof SMTP_ENCRYPTIONS)[number];

export type Member = {
  name: string;
  email: string;
  /**
   * Read-only, computed by the API: whether an account exists for this email.
   * Never persisted and ignored when sent back in an update body.
   */
  registered?: boolean;
};

export type WebServerConfig = {
  domain?: string;
  acmeEmail?: string;
  httpsEnabled: boolean;
  ipAccessEnabled?: boolean;
};

export interface RealmType {
  _id: string;
  name: string;
  member1: Member;
  member2?: Member | null;
  addresses: Address[];
  bankInfo: BankInfo;
  contacts: Contact[];
  isCompany?: boolean;
  companyInfo: CompanyInfo | null;
  thirdParties: {
    smtp?: {
      server?: string;
      port?: number;
      encryption?: SmtpEncryption;
      authentication?: boolean;
      username?: string;
      password?: string;
      fromEmail?: string;
      replyToEmail?: string;
    };
  };
  locale: Locale;
  currency: string;
  webServer?: WebServerConfig;
}
