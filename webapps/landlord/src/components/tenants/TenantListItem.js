import { Badge } from '@microrealestate/commonui/components/ui/badge';
import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@microrealestate/commonui/components/ui/card';
import { Progress } from '@microrealestate/commonui/components/ui/progress';
import { cn } from '@microrealestate/commonui/utils';
import _ from 'lodash';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useStore } from '@/providers/StoreProvider';
import TenantAvatar from './TenantAvatar';
import TenantPropertyList from './TenantPropertyList';
import TenantStatus from './TenantStatus';

export default function TenantListItem({ tenant }) {
  const router = useRouter();
  const store = useStore();
  const t = useTranslations('common');

  const handleClick = useCallback(async () => {
    store.tenant.setSelected(tenant);
    await router.push(`/tenants/${tenant._id}`);
  }, [store.tenant, tenant, router]);

  // compute progress of duration of lease
  const progress = useMemo(() => {
    if (tenant.beginDate) {
      const startDate = moment(tenant.beginDate);
      const endDate = moment(tenant.terminationDate || tenant.endDate);
      const duration = endDate.diff(startDate, 'days');
      const elapsed = moment().diff(startDate, 'days');
      return Math.round((elapsed / duration) * 100);
    }
    return 0;
  }, [tenant.beginDate, tenant.endDate, tenant.terminationDate]);

  return (
    <Card className="relative">
      <TenantStatus tenant={tenant} className="absolute top-1 right-1" />
      <CardHeader className="mb-4 cursor-pointer" onClick={handleClick}>
        <CardTitle className="flex justify-start items-center gap-2">
          <TenantAvatar tenant={tenant} />
          <div>
            <Button
              variant="link"
              className="w-fit h-fit p-0 text-lg whitespace-normal text-left"
              data-cy="openResourceButton"
            >
              {tenant.name}
            </Button>
            <div className="text-xs font-normal text-muted-foreground">
              {tenant.isCompany
                ? _.startCase(_.capitalize(tenant.manager))
                : null}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground pb-0">
        <div className="cursor-pointer" onClick={handleClick}>
          <div>
            {tenant.beginDate
              ? tenant.lease?.name || t('custom')
              : t('No associated contract')}
          </div>
          <Progress
            value={progress}
            className={cn('h-2 my-2 bg-secondary')}
            indicatorClassName={
              tenant.terminated ? 'bg-muted-foreground/30' : 'bg-chart-success'
            }
          />
          <div className="text-xs">
            {tenant.beginDate
              ? t('From {startDate} to {endDate}', {
                  startDate: moment(tenant.beginDate).format('L'),
                  endDate: moment(
                    tenant.terminationDate || tenant.endDate
                  ).format('L')
                })
              : null}
          </div>
        </div>
        <TenantPropertyList tenant={tenant} className="mt-6" />
      </CardContent>

      <CardFooter className="p-0 flex-col">
        <div className="flex items-center justify-between w-full py-4 px-6">
          <Badge
            variant={tenant.terminated ? 'secondary' : 'success'}
            className="font-normal"
          >
            {tenant.terminated ? t('Lease ended') : t('Lease running')}
          </Badge>
        </div>
      </CardFooter>
    </Card>
  );
}
