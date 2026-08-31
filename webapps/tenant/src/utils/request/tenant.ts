import type { API } from '@microrealestate/shared';
import type { Lease } from '@/types';
import { toUILease } from '..';
import { getTenantApiFetcher } from '../fetch/server';

export async function fetchAllTenants(): Promise<Lease[]> {
  const apiFetcher = await getTenantApiFetcher();
  const response =
    await apiFetcher.get<API.Tenant.GetAllTenants.ResponseBody>(`/tenants`);

  if (!response.data?.results) {
    return [];
  }

  return response.data.results.map(toUILease);
}
