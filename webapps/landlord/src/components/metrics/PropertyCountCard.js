import { PROPERTY_COUNT_WARN_THRESHOLD } from '@microrealestate/shared';
import { useQuery } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import { LuKeyRound, LuTriangleAlert } from 'react-icons/lu';
import PropertyThresholdNotice from '@/components/PropertyThresholdNotice';
import { useRouter } from '@/i18n/navigation';
import { fetchPropertyCount, QueryKeys } from '../../utils/restcalls';
import { DashboardCard } from '../dashboard/DashboardCard';

function PropertyCountCard({ className }) {
  const router = useRouter();
  const t = useTranslations('common');

  const { data, isLoading, error } = useQuery({
    queryKey: [QueryKeys.PROPERTY_COUNT],
    queryFn: () => fetchPropertyCount(),
    refetchOnMount: 'always',
    retry: 3
  });

  const overThreshold =
    !error && (data?.count ?? 0) > PROPERTY_COUNT_WARN_THRESHOLD;

  return (
    <DashboardCard
      Icon={LuKeyRound}
      title={t('Properties')}
      description={
        overThreshold ? (
          <PropertyThresholdNotice />
        ) : (
          t('Total number of properties')
        )
      }
      loading={isLoading}
      renderContent={() => {
        if (error) {
          return '-';
        }
        return overThreshold ? (
          <span className="flex items-center gap-2 text-warning">
            <LuTriangleAlert className="size-[0.8em] shrink-0" />
            {data?.count}
          </span>
        ) : (
          data?.count
        );
      }}
      onClick={() => {
        router.push(`/properties`);
      }}
      className={className}
    />
  );
}

export default observer(PropertyCountCard);
