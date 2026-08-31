import type { Rent } from '../../../entities/tenant';

export type RequestParams = {
  year: string;
  month: string;
};

export type ResponseBody = {
  tenant: {
    _id: string;
    name: string;
    reference: string;
  };
  balance: number;
  rent: Rent;
}[];
