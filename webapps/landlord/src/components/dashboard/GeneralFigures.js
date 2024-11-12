import { LuCoins, LuKeyRound, LuPercent, LuUserCircle } from 'react-icons/lu';
import { cn } from '../../utils';
import { DashboardCard } from './DashboardCard';
import NumberFormat from '../NumberFormat';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../../store';
import { useContext } from 'react';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

function GeneralFigures({ className }) {
  const store = useContext(StoreContext);
  const router = useRouter();
  const { t } = useTranslation('common');

  const overview = store.dashboard.data.overview;
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
        className
      )}
    >
      <DashboardCard
        Icon={LuUserCircle}
        title={t('Tenants')}
        description={t('Total number of tenants')}
        renderContent={() => overview?.tenantCount}
        onClick={() => {
          router.push(`/${store.organization.selected.name}/tenants`);
        }}
      />
      <DashboardCard
        Icon={LuKeyRound}
        title={t('Properties')}
        description={t('Total number of properties')}
        renderContent={() => overview?.propertyCount}
        onClick={() => {
          router.push(`/${store.organization.selected.name}/properties`);
        }}
      />
      <DashboardCard
        Icon={LuPercent}
        title={t('Occupancy rate')}
        description={t('Percentage of occupied properties')}
        renderContent={() => (
          <NumberFormat
            value={overview?.occupancyRate}
            showZero={true}
            minimumFractionDigits={0}
            style="percent"
          />
        )}
      />
      <DashboardCard
        Icon={LuCoins}
        title={t('Revenues')}
        description={t('Total revenues for the year')}
        renderContent={() => (
          <NumberFormat value={overview?.totalYearRevenues} showZero={true} />
        )}
      />
    </div>
  );
}

export default observer(GeneralFigures);
