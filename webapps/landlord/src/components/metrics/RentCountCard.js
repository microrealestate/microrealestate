import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { BsReceipt } from 'react-icons/bs';
import { fetchRentCount, QueryKeys } from '../../utils/restcalls';
import { DashboardCard } from '../dashboard/DashboardCard';

export default function RentCountCard({ month, year, className }) {
  const t = useTranslations('common');
  const currentMonth = moment();
  if (month) {
    currentMonth.month(month - 1);
  }
  if (year) {
    currentMonth.year(year);
  }

  const { data, isLoading, error } = useQuery({
    queryKey: [
      QueryKeys.RENT_COUNT,
      currentMonth.year(),
      currentMonth.month() + 1
    ],
    queryFn: () =>
      fetchRentCount(currentMonth.month() + 1, currentMonth.year()),
    refetchOnMount: 'always',
    retry: 3
  });

  return (
    <DashboardCard
      Icon={BsReceipt}
      title={t('Rents')}
      description={t('Rents for the period')}
      loadingContent={isLoading}
      renderContent={() => (error ? '-' : data?.count)}
      className={className}
    />
  );
}
