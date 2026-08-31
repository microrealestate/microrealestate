import type { API } from '@microrealestate/shared';

export type Property = API.Tenant.TenantDataType['lease']['properties'][number];

export type Receipt = Pick<
  API.Tenant.TenantDataType['lease']['receipts'][number],
  'id' | 'term' | 'grandTotal' | 'payment' | 'status' | 'methods'
>;

export type Lease = {
  landlord: API.Tenant.TenantDataType['landlord'];
  tenant: API.Tenant.TenantDataType['tenant'];
} & Omit<
  API.Tenant.TenantDataType['lease'],
  'receipts' | 'properties' | 'beginDate' | 'endDate' | 'terminationDate'
> & {
    properties: Property[];
    receipts: Receipt[];
    beginDate?: Date;
    endDate?: Date;
    terminationDate?: Date;
  };
