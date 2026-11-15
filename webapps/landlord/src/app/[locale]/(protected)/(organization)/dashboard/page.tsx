'use client';

import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import useDashboardActions from '@/components/dashboard/useDashboardActions';
import ContractsNearRenewalCard from '@/components/metrics/ContractsNearRenewalCard';
import MonthRevenuesCard from '@/components/metrics/MonthRevenuesCard';
import OccupancyRateCard from '@/components/metrics/OccupancyRateCard';
import PropertyCountCard from '@/components/metrics/PropertyCountCard';
import RevenuesBreakdownCard from '@/components/metrics/RevenuesBreakdownCard';
import TenantCountCard from '@/components/metrics/TenantCountCard';
import TopUnpaidCard from '@/components/metrics/TopUnpaidCard';
import YearRevenuesCard from '@/components/metrics/YearRevenuesCard';
import Page from '@/components/Page';
import PropertyThresholdAlert from '@/components/PropertyThresholdAlert';
import { useStore } from '@/providers/StoreProvider';

const DashboardContent = observer(function DashboardContent() {
  const t = useTranslations('common');
  const store = useStore();
  const { actions, dialogs } = useDashboardActions();

  return (
    <Page
      description={t(
        'Rent collected, occupancy and unpaid rents of your properties at a glance.'
      )}
      title={t('Dashboard')}
      greeting={t('Welcome {firstName} {lastName}!', {
        firstName: store.user.firstName,
        lastName: store.user.lastName
      })}
      actions={actions}
      headerLayout="stacked"
      dataCy="dashboardPage"
    >
      <div className="@container/dashboard flex flex-col gap-4 md:gap-6">
        <PropertyThresholdAlert />
        <div className="grid gap-4 md:gap-6 @min-[60rem]:grid-flow-col @min-[60rem]:auto-cols-fr">
          <MonthRevenuesCard />
          <TopUnpaidCard />
          <ContractsNearRenewalCard />
        </div>
        <div className="grid grid-cols-2 gap-4 md:gap-6 @min-[36rem]:grid-cols-3 @min-[60rem]:grid-cols-6">
          <div className="col-span-full @min-[60rem]:col-span-2">
            <YearRevenuesCard />
          </div>
          <div className="col-span-2 @min-[36rem]:col-span-1 @min-[60rem]:col-span-2">
            <OccupancyRateCard />
          </div>
          <TenantCountCard />
          <PropertyCountCard />
        </div>
        <RevenuesBreakdownCard />
      </div>
      {dialogs}
    </Page>
  );
});

export default function Dashboard() {
  return <DashboardContent />;
}
