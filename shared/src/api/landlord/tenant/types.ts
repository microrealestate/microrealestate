import type { OccupantStatus, TenantType } from '../../../entities/tenant';
import type { LeaseData } from '../lease/types';

export type OccupantData = TenantType & {
  lease?: Omit<LeaseData, 'usedByTenants'>;
  frequency: string;
  status: OccupantStatus;
  terminated: boolean;
  rental: number;
  expenses: number;
  preTaxTotal?: number;
  total: number;
  vat?: number;
  office?: { surface: number; price: number };
  parking?: { price: number };
  hasPayments: boolean;
  filesToUpload?: {
    _id: string;
    name: string;
    description?: string;
    required?: boolean;
    requiredOnceContractTerminated?: boolean;
    missing: boolean;
    documents: Array<{ _id: string; expiryDate?: string }>;
  }[];
};

export type OccupantRequestBody = Partial<TenantType> & {
  frequency?: string;
};
