import { ContractCard } from '@/components/contract-card';
import getServerSession from '@/utils/session/server/getsession';
import Request from '@/utils/request';

export default async function Home() {
  const session = await getServerSession();
  if (!session || !session.email) {
    return null;
  }

  const leases = await Request.fetchAllTenants();

  return (
    <main className="flex flex-col gap-10">
      {leases.map((lease) => (
        <ContractCard key={lease.tenant.id} lease={lease} />
      ))}
    </main>
  );
}
