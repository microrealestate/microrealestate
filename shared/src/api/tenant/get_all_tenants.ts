import type { TenantDataType } from './types';

export type RequestParams = Record<string, never>;

export type ResponseBody = {
  results: TenantDataType[];
};
