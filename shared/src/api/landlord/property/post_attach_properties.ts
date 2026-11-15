import type { PropertyWithOccupancyData } from './types';

export type RequestParams = { id: string };
export type RequestBody = { ids: string[] };
export type ResponseBody = PropertyWithOccupancyData[];
