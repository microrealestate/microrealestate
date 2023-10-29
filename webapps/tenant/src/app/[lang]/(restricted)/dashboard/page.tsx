import { BalanceCard } from '@/components/balance-card';
import { ContractCard } from '@/components/contract-card';

export default function Home() {
  return (
    <main className="flex flex-col gap-10">
      <BalanceCard />
      <ContractCard />
    </main>
  );
}
