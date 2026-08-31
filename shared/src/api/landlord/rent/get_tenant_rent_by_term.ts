import type { RentViewData } from './types';

export type RequestParams = { id: string; term: string };
export type RequestBody = Record<string, never>;
export type ResponseBody = RentViewData;
