import type { RentMonthOverview, RentViewData } from './types';

export type RequestParams = { year: string; month: string };
export type RequestBody = Record<string, never>;
export type ResponseBody = {
  overview: RentMonthOverview;
  rents: RentViewData[];
};
