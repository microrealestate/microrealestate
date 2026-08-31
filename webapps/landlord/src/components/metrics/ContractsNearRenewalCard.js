import { Badge } from '@microrealestate/commonui/components/ui/badge';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import { LuRefreshCw } from 'react-icons/lu';
import { useRouter } from '@/i18n/navigation';
import { fetchContractsNearRenewal, QueryKeys } from '../../utils/restcalls';
import { DashboardCard } from '../dashboard/DashboardCard';

function ContractsNearRenewalCard({ daysThreshold = 90 }) {
  const t = useTranslations('common');
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: [QueryKeys.CONTRACTS_NEAR_RENEWAL, daysThreshold],
    queryFn: () => fetchContractsNearRenewal(daysThreshold),
    refetchOnMount: 'always',
    retry: 3
  });

  const getUrgencyVariant = (daysRemaining) => {
    if (daysRemaining < 30) return 'destructive';
    if (daysRemaining < 60) return 'warning';
    return 'secondary';
  };

  const handleClick = (tenant) => () => {
    router.push(`/tenants/${tenant._id}`);
  };

  if (!isLoading && (!data || data.length === 0)) {
    return null;
  }

  return (
    <DashboardCard
      Icon={LuRefreshCw}
      title={t('Contracts near renewal')}
      description={t('Days remaining before contract end')}
      loading={isLoading}
      renderContent={() =>
        error ? (
          '-'
        ) : (
          <div className="flex flex-col gap-2 min-h-24 md:min-h-48 max-h-64 md:max-h-96 overflow-y-auto">
            {data.map((tenant) => (
              <div
                key={tenant._id}
                className="flex items-center justify-between text-sm md:text-base"
              >
                <div className="flex items-center gap-2">
                  <Button
                    variant="link"
                    onClick={handleClick(tenant)}
                    className="justify-start grow p-0 m-0 whitespace-normal text-left"
                  >
                    {tenant.name}
                  </Button>
                  {tenant.autoRenew ? (
                    <LuRefreshCw
                      className="size-4 shrink-0 text-muted-foreground"
                      title={t('Automatic renewal')}
                    />
                  ) : null}
                </div>
                <Badge variant={getUrgencyVariant(tenant.daysRemaining)}>
                  <span className="text-base">{`${tenant.daysRemaining}${t('day_abbrev')}`}</span>
                </Badge>
              </div>
            ))}
          </div>
        )
      }
    />
  );
}

export default observer(ContractsNearRenewalCard);
