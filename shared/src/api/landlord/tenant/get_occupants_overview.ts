export type RequestParams = Record<string, never>;
export type RequestBody = Record<string, never>;
export type ResponseBody = {
  countAll: number;
  countActive: number;
  countInactive: number;
};
