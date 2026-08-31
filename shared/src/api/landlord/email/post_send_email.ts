export type RequestParams = Record<string, never>;

export type RequestBody = {
  document: string;
  tenantIds: string[];
  terms?: number[];
  year: string;
  month: string;
};

export type ResponseBody = Array<{
  name: string;
  tenantId: string;
  document: string;
  term: number;
  email?: string;
  status?: string;
  error?: { status: number; message: string };
}>;
