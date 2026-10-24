import type { EmailName, RentEmailName } from '../../entities/email';

export type RentEmailParams = { term: number };

export type OtpEmailParams = { otp: string };

export type ResetPasswordEmailParams = { token: string };

export type SendEmailParams =
  | RentEmailParams
  | OtpEmailParams
  | ResetPasswordEmailParams;

export type RequestParams = Record<string, never>;

export type RequestBody =
  | {
      templateName: RentEmailName;
      recordId: string;
      params: RentEmailParams;
    }
  | {
      templateName: 'otp';
      recordId: string;
      params: OtpEmailParams;
    }
  | {
      templateName: 'reset_password';
      recordId: string;
      params: ResetPasswordEmailParams;
    };

export type SendStatus = {
  id?: string;
  message: string;
};

export type ResponseBody = Array<{
  templateName: EmailName;
  recordId: string;
  params: SendEmailParams;
  email: string;
  status: SendStatus;
}>;
