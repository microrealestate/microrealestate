import { useQuery } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import { LuKeyRound } from 'react-icons/lu';
import { useRouter } from '@/i18n/navigation';
import { fetchPropertyCount, QueryKeys } from '../../utils/restcalls';
import { DashboardCard } from '../dashboard/DashboardCard';

function PropertyCountCard() {
  const router = useRouter();
  const t = useTranslations('common');

  const { data, isLoading, error } = useQuery({
    queryKey: [QueryKeys.PROPERTY_COUNT],
    queryFn: () => fetchPropertyCount(),
    refetchOnMount: 'always',
    retry: 3
  });

  return (
    <DashboardCard
      Icon={LuKeyRound}
      title={t('Properties')}
      description={t('Total number of properties')}
      loading={isLoading}
      renderContent={() => (error ? '-' : data?.count)}
      onClick={() => {
        router.push(`/properties`);
      }}
    />
  );
}

export default observer(PropertyCountCard);
