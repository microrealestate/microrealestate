import type { OccupantData } from '../tenant/types';
import type { RentViewData } from './types';

export type RequestParams = { id: string };
export type RequestBody = Record<string, never>;
export type ResponseBody = {
  occupant: OccupantData;
  rents: RentViewData[];
};
