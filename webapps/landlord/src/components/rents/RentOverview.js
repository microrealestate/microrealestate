import {
  CalendarFoldIcon,
  ReceiptTextIcon,
  TrendingDownIcon,
  TrendingUpIcon
} from 'lucide-react';
import { useCallback, useContext } from 'react';
import { DashboardCard } from '../dashboard/DashboardCard';
import NumberFormat from '../NumberFormat';
import PeriodPicker from '../PeriodPicker';
import { StoreContext } from '../../store';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

export function RentOverview({ data }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();

  const handlePeriodChange = useCallback(
    async (period) => {
      store.rent.setPeriod(period);
      await router.push(
        `/${store.organization.selected.name}/rents/${store.rent.periodAsString}`
      );
    },
    [router, store.rent, store.organization.selected.name]
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-5 gap-4">
      <DashboardCard
        Icon={CalendarFoldIcon}
        title={t('Period')}
        renderContent={() => (
          <PeriodPicker value={data.period} onChange={handlePeriodChange} />
        )}
        className="2xl:col-span-2"
      />

      <DashboardCard
        Icon={ReceiptTextIcon}
        title={t('Rents')}
        description={t('Rents for the period')}
        renderContent={() => data.countAll}
        className="hidden sm:block 2xl:col-span-1"
      />
      <DashboardCard
        Icon={TrendingDownIcon}
        title={t('Not paid')}
        description={t('{{count}} rents', {
          count: data.countNotPaid
        })}
        renderContent={() => (
          <NumberFormat
            value={data.totalNotPaid}
            debitColor={true}
            className="flex-grow"
          />
        )}
        className="hidden sm:block 2xl:col-span-1"
      />
      <DashboardCard
        Icon={TrendingUpIcon}
        title={t('Paid')}
        description={t('{{count}} rents', {
          count: data.countPaid + data.countPartiallyPaid
        })}
        renderContent={() => (
          <NumberFormat
            value={data.totalPaid}
            creditColor={true}
            className="flex-grow"
          />
        )}
        className="hidden sm:block 2xl:col-span-1"
      />
    </div>
  );
}
