import { observer } from 'mobx-react-lite';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { RiContractLine } from 'react-icons/ri';
import { useStore } from '@/providers/StoreProvider';
import { DashboardCard } from '../dashboard/DashboardCard';
import NumberFormat from '../NumberFormat';

function ContractOverviewCard() {
  const t = useTranslations('common');
  const store = useStore();
  const tenant = store.tenant.selected;

  return (
    <DashboardCard
      Icon={RiContractLine}
      title={t('Lease')}
      renderContent={() => (
        <div className="text-base space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('Contract')}</span>
            <span>{tenant.lease?.name ?? '--'}</span>
          </div>
          {!tenant.stepperMode && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Status')}</span>
              <span>
                {tenant.terminated ? t('Terminated') : t('In progress')}
              </span>
            </div>
          )}
          {tenant.beginDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Start date')}</span>
              <span>{moment(tenant.beginDate).format('L')}</span>
            </div>
          )}
          {(tenant.terminationDate || tenant.endDate) && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('End date')}</span>
              <span>
                {moment(tenant.terminationDate || tenant.endDate).format('L')}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('Deposit')}</span>
            <NumberFormat
              value={(tenant.securityDeposit || []).reduce(
                (s, e) => s + (e.amount || 0),
                0
              )}
            />
          </div>
        </div>
      )}
    />
  );
}

export default observer(ContractOverviewCard);
