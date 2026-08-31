export type RequestParams = {
  year: string;
};

export type ResponseBody = {
  month: string;
  paid: number;
  notPaid: number;
}[];
