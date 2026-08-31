export type RequestParams = {
  year: string;
  month: string;
};

export type ResponseBody = {
  paid: number;
  notPaid: number;
  paidCount: number;
  partiallyPaidCount: number;
  notPaidCount: number;
};
