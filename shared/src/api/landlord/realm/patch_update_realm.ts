import type { RealmData, RealmThirdPartiesRequestBody } from './types';

export type RequestParams = { id: string };
export type RequestBody = Omit<RealmData, 'thirdParties'> & {
  thirdParties?: RealmThirdPartiesRequestBody;
};
export type ResponseBody = RealmData;
