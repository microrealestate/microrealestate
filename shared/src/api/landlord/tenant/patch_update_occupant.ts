import type { OccupantData, OccupantRequestBody } from './types';

export type RequestParams = { id: string };
export type RequestBody = OccupantRequestBody;
export type ResponseBody = OccupantData | null;
