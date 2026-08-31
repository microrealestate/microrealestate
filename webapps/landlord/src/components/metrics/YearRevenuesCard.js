import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { LuCoins } from 'react-icons/lu';
import { fetchYearRevenues, QueryKeys } from '../../utils/restcalls';
import { DashboardCard } from '../dashboard/DashboardCard';
import NumberFormat from '../NumberFormat';

export default function YearRevenuesCard({ year, className }) {
  const t = useTranslations('common');
  const currentYear = year || moment().year();

  const { data, isLoading, error } = useQuery({
    queryKey: [QueryKeys.YEAR_REVENUES, currentYear],
    queryFn: () => fetchYearRevenues(currentYear),
    refetchOnMount: 'always',
    retry: 3
  });

  return (
    <DashboardCard
      Icon={LuCoins}
      title={t('Revenues')}
      description={t('Total revenues for the year')}
      loading={isLoading}
      renderContent={() =>
        error || !data ? (
          '-'
        ) : (
          <NumberFormat value={data.total} showZero={true} />
        )
      }
      className={className}
    />
  );
}
