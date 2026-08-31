export type LeaseStatus = 'active' | 'ended' | 'terminated';

export const LEASE_TIME_RANGES = [
  'hours',
  'days',
  'weeks',
  'months',
  'years'
] as const;
export type LeaseTimeRange = (typeof LEASE_TIME_RANGES)[number];

export interface LeaseType<Realm = string> {
  _id: string;
  realmId: Realm;
  name: string;
  description?: string;
  numberOfTerms?: number;
  timeRange?: LeaseTimeRange;
  active: boolean;
  autoRenew?: boolean;
  stepperMode?: boolean;
}
