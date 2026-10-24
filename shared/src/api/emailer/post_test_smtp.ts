import type { SmtpEncryption } from '../../entities/realm';

export type RequestParams = Record<string, never>;

export type RequestBody = {
  smtp?: {
    server?: string;
    port?: number;
    encryption?: SmtpEncryption;
    authentication?: boolean;
    username?: string;
    password?: string;
    passwordUpdated?: boolean;
  };
};

export type ResponseBody = { status: 'ok' };
