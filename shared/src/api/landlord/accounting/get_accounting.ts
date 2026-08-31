import type { PropertyType } from '../../../entities/property';
import type { Payment, TenantType } from '../../../entities/tenant';

export type RequestParams = {
  year: string;
};

export type IncomingTenant = Pick<TenantType, '_id' | 'name' | 'reference'> & {
  properties: Array<Pick<PropertyType, '_id' | 'name' | 'type'>>;
  beginDate: string;
  endDate: string;
  terminationDate?: string;
  securityDeposit: number;
};

export type OutgoingTenant = IncomingTenant & {
  securityDepositRefund: number;
  balance: number;
  finalBalance: number;
};

export type Settlement = {
  tenantId: string;
  tenant: string;
  beginDate: string;
  endDate: string;
  settlements: (Payment[] | null)[];
};

export type ResponseBody = {
  year: number;
  incomingTenants: IncomingTenant[];
  outgoingTenants: OutgoingTenant[];
  settlements: Settlement[];
};
