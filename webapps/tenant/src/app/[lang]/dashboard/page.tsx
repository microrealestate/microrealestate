import * as Mocks from '@/mocks/api';
import { ContractCard } from '@/components/contract-card';
import getApiFetcher from '@/utils/fetch/server';
import getServerEnv from '@/utils/env/server';
import getServerSession from '@/utils/session/server/getsession';
import { Lease } from '@/types';
import { TenantAPI } from '@microrealestate/types';

async function fetchData(): Promise<Lease[]> {
  let data;
  if (getServerEnv('DEMO_MODE') === 'true') {
    data = Mocks.getTenants;
  } else {
    const response = await getApiFetcher().get<TenantAPI.GetTenants.Response>(
      `/tenantapi/tenants`
    );
    data = response.data;
  }

  if (data.error) {
    console.error(data.error);
    throw new Error(data.error);
  }

  if (!data.results) {
    return [];
  }

  const leases: Lease[] =
    data.results.map((tenant) => ({
      landlord: tenant.landlord,
      tenant: tenant.tenant,
      name: tenant.lease.name,
      beginDate: tenant.lease.beginDate
        ? new Date(tenant.lease.beginDate)
        : undefined,
      endDate: tenant.lease.endDate
        ? new Date(tenant.lease.endDate)
        : undefined,
      terminationDate: tenant.lease.terminationDate
        ? new Date(tenant.lease.terminationDate)
        : undefined,
      timeRange: tenant.lease.timeRange,
      status: tenant.lease.status,
      properties: tenant.lease.properties.map((property) => ({
        id: property.id,
        name: property.name,
        description: property.description,
        type: property.type,
      })),
      balance: tenant.lease.balance,
      deposit: tenant.lease.deposit,
      invoices: tenant.lease.invoices.map((invoice) => ({
        id: String(invoice.term),
        term: invoice.term,
        grandTotal: invoice.grandTotal,
        payment: invoice.payment,
        status: invoice.status,
        methods: invoice.methods,
      })),
      documents: [],
      //documents: tenant.lease.documents.map((document) => ({})),
    })) || [];

  return leases;
}

export default async function Home() {
  const session = await getServerSession();
  if (!session || !session.email) {
    return null;
  }

  const leases = await fetchData();

  return (
    <main className="flex flex-col gap-10">
      {leases.map((lease) => (
        <ContractCard key={lease.tenant.id} lease={lease} />
      ))}
    </main>
  );
}
