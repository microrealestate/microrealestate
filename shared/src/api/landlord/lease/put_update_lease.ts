import type { LeaseTimeRange } from '../../../entities/lease';
import type { LeaseData } from './types';

export type RequestParams = Record<string, never>;
export type RequestBody = {
  _id: string;
  name: string;
  description?: string;
  numberOfTerms?: number;
  timeRange?: LeaseTimeRange;
  active?: boolean;
  autoRenew?: boolean;
  stepperMode?: boolean;
};
export type ResponseBody = LeaseData;
