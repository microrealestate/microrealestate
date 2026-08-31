import type { RealmData } from './types';

export type RequestParams = Record<string, never>;
export type RequestBody = Omit<RealmData, '_id'>;
export type ResponseBody = RealmData;
