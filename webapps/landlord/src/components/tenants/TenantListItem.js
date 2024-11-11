import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '../ui/card';
import { useCallback, useContext, useMemo } from 'react';
import _ from 'lodash';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../../utils';
import CompulsoryDocumentStatus from './CompulsaryDocumentStatus';
import moment from 'moment';
import { Progress } from '../ui/progress';
import { StoreContext } from '../../store';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

export default function TenantListItem({ tenant }) {
  const router = useRouter();
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');

  const handleClick = useCallback(async () => {
    store.tenant.setSelected(tenant);
    store.appHistory.setPreviousPath(router.asPath);
    await router.push(
      `/${store.organization.selected.name}/tenants/${tenant._id}`
    );
  }, [
    store.tenant,
    store.appHistory,
    store.organization.selected.name,
    tenant,
    router
  ]);

  // compute progress of duration of lease
  const progress = useMemo(() => {
    if (tenant.beginDate) {
      const startDate = moment(tenant.beginDate, 'DD/MM/YYYY');
      const endDate = moment(
        tenant.terminationDate || tenant.endDate,
        'DD/MM/YYYY'
      );
      const duration = endDate.diff(startDate, 'days');
      const elapsed = moment().diff(startDate, 'days');
      return Math.round((elapsed / duration) * 100);
    }
    return 0;
  }, [tenant.beginDate, tenant.endDate, tenant.terminationDate]);

  return (
    <Card onClick={handleClick} className="cursor-pointer">
      <CardHeader>
        <CardTitle className="flex flex-col justify-start">
          <Badge
            variant={tenant.terminated ? 'secondary' : 'success'}
            className="mb-4 w-fit border border-secondary-foreground/20"
          >
            {tenant.terminated ? t('Lease ended') : t('Lease running')}
          </Badge>
          <Button
            variant="link"
            className="justify-start p-0 m-0 text-xl whitespace-normal text-left"
            data-cy="openResourceButton"
          >
            {tenant.name}
          </Button>
        </CardTitle>
        <CardDescription>
          {tenant.isCompany ? _.startCase(_.capitalize(tenant.manager)) : null}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-lg">
          {tenant.beginDate
            ? tenant.lease?.name || t('custom')
            : t('No associated contract')}
        </div>
        <div className="text-sm text-muted-foreground">
          {tenant.beginDate
            ? t('From {{startDate}} to {{endDate}}', {
                startDate: moment(tenant.beginDate, 'DD/MM/YYYY').format('L'),
                endDate: moment(
                  tenant.terminationDate || tenant.endDate,
                  'DD/MM/YYYY'
                ).format('L')
              })
            : null}
        </div>
        <Progress
          value={progress}
          className={cn(
            'h-4 mt-4 bg-secondary-foreground/10',
            tenant.terminated ? 'invisible' : ''
          )}
          indicatorClassName={
            tenant.terminated ? 'bg-secondary-foreground/40' : 'bg-success'
          }
        />
      </CardContent>

      <CardFooter>
        <CompulsoryDocumentStatus tenant={tenant} />
      </CardFooter>
    </Card>
  );
}
