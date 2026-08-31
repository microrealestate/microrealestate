import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { LuPercent } from 'react-icons/lu';
import { fetchOccupancyRate, QueryKeys } from '../../utils/restcalls';
import { DashboardCard } from '../dashboard/DashboardCard';
import NumberFormat from '../NumberFormat';

export default function OccupancyRateCard({ year, className }) {
  const t = useTranslations('common');
  const currentYear = year || moment().year();

  const { data, isLoading, error } = useQuery({
    queryKey: [QueryKeys.OCCUPANCY_RATE, currentYear],
    queryFn: () => fetchOccupancyRate(currentYear),
    refetchOnMount: 'always',
    retry: 3
  });

  return (
    <DashboardCard
      Icon={LuPercent}
      title={t('Occupancy rate')}
      description={t('Percentage of occupied properties')}
      loading={isLoading}
      renderContent={() =>
        error ? (
          '-'
        ) : (
          <NumberFormat
            value={data?.rate}
            showZero={true}
            minimumFractionDigits={0}
            style="percent"
          />
        )
      }
      className={className}
    />
  );
}
