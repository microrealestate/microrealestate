import type { OccupantData, OccupantRequestBody } from './types';

export type RequestParams = Record<string, never>;
export type RequestBody = OccupantRequestBody;
export type ResponseBody = OccupantData | null;
