export type RequestQuery = {
  days?: string;
};

export type ResponseBody = {
  _id: string;
  name: string;
  reference: string;
  beginDate: string;
  endDate: string;
  leaseId: string;
  autoRenew: boolean;
  daysRemaining: number;
}[];
