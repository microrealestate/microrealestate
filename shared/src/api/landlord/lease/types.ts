import type { LeaseType } from '../../../entities/lease';

export type LeaseData = Omit<LeaseType, 'active'> & {
  active?: boolean;
  usedByTenants: boolean;
};
