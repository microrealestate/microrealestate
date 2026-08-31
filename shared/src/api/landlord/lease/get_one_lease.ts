import type { LeaseData } from './types';

export type RequestParams = { id: string };
export type RequestBody = Record<string, never>;
export type ResponseBody = LeaseData;
