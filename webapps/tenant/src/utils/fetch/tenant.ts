import type { API } from '@microrealestate/shared';
import type { Lease } from '@/types';
import { toUILease } from '..';
import apiClient from './client';

export async function fetchAllTenantsClient(): Promise<Lease[]> {
  const { data } =
    await apiClient.get<API.Tenant.GetAllTenants.ResponseBody>(
      '/tenantapi/tenants'
    );
  if (!data.results) return [];
  return data.results.map(toUILease);
}
