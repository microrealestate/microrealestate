'use client';

import Shortcuts from '@/components/dashboard/Shortcuts';
import ContractsNearRenewalCard from '@/components/metrics/ContractsNearRenewalCard';
import MonthRevenuesCard from '@/components/metrics/MonthRevenuesCard';
import OccupancyRateCard from '@/components/metrics/OccupancyRateCard';
import PropertyCountCard from '@/components/metrics/PropertyCountCard';
import RevenuesBreakdownCard from '@/components/metrics/RevenuesBreakdownCard';
import TenantCountCard from '@/components/metrics/TenantCountCard';
import TopUnpaidCard from '@/components/metrics/TopUnpaidCard';
import YearRevenuesCard from '@/components/metrics/YearRevenuesCard';
import Page from '@/components/Page';
import Welcome from '@/components/Welcome';

export default function Dashboard() {
  return (
    <Page dataCy="dashboardPage">
      <div className="grid md:grid-cols-2 gap-4">
        <Shortcuts className="md:col-span-2" />
        <Welcome className="md:col-span-2 md:mt-8 mb-8" />
        <div className="md:col-span-2 grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
          <TopUnpaidCard />
          <ContractsNearRenewalCard />
        </div>
        <YearRevenuesCard />
        <OccupancyRateCard />
        <div className="flex flex-col gap-4">
          <TenantCountCard />
          <PropertyCountCard />
        </div>
        <MonthRevenuesCard />
        <RevenuesBreakdownCard className="md:col-span-2" />
      </div>
    </Page>
  );
}
