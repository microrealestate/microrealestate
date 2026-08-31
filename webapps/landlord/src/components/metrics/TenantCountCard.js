import { useQuery } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { LuCircleUser } from 'react-icons/lu';
import { useRouter } from '@/i18n/navigation';
import { fetchTenantCount, QueryKeys } from '../../utils/restcalls';
import { DashboardCard } from '../dashboard/DashboardCard';

function TenantCountCard({ year, className }) {
  const router = useRouter();
  const t = useTranslations('common');
  const currentYear = year || moment().year();

  const { data, isLoading, error } = useQuery({
    queryKey: [QueryKeys.TENANT_COUNT, currentYear],
    queryFn: () => fetchTenantCount(currentYear),
    refetchOnMount: 'always',
    retry: 3
  });

  return (
    <DashboardCard
      Icon={LuCircleUser}
      title={t('Tenants')}
      description={t('Total number of tenants')}
      loading={isLoading}
      renderContent={() => (error ? '-' : data?.count)}
      onClick={() => {
        router.push(`/tenants`);
      }}
      className={className}
    />
  );
}

export default observer(TenantCountCard);
