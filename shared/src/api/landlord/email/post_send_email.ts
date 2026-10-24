import type { RentEmailName } from '../../../entities/email';
import type { SendStatus } from '../../emailer/post_send_email';

export type RequestParams = Record<string, never>;

export type RequestBody = {
  document: RentEmailName;
  tenantIds: string[];
  terms?: number[];
  year: string;
  month: string;
};

export type ResponseBody = Array<{
  name: string;
  tenantId: string;
  document: RentEmailName;
  term: number;
  email?: string;
  status?: SendStatus;
  error?: { status: number; message: string };
}>;
