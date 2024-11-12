import CompulsoryDocumentStatus from './CompulsaryDocumentStatus';
import { DashboardCard } from '../dashboard/DashboardCard';
import moment from 'moment';
import NumberFormat from '../NumberFormat';
import { RiContractLine } from 'react-icons/ri';
import { StoreContext } from '../../store';
import { useContext } from 'react';
import useTranslation from 'next-translate/useTranslation';

export default function ContractOverviewCard() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  return (
    <DashboardCard
      Icon={RiContractLine}
      title={t('Lease')}
      renderContent={() => (
        <div className="text-base space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('Contract')}</span>
            <span>{store.tenant.selected.contract}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('Status')}</span>
            <span>
              {store.tenant.selected.terminated
                ? t('Terminated')
                : t('In progress')}
            </span>
          </div>
          {store.tenant.selected.beginDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Start date')}</span>
              <span>
                {moment(store.tenant.selected.beginDate, 'DD/MM/YYYY').format(
                  'L'
                )}
              </span>
            </div>
          )}
          {(store.tenant.selected.terminationDate ||
            store.tenant.selected.endDate) && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('End date')}</span>
              <span>
                {moment(
                  store.tenant.selected.terminationDate ||
                    store.tenant.selected.endDate,
                  'DD/MM/YYYY'
                ).format('L')}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('Deposit')}</span>
            <NumberFormat value={store.tenant.selected.guaranty} />
          </div>
          <CompulsoryDocumentStatus
            tenant={store.tenant.selected}
            className="mt-4"
          />
        </div>
      )}
    />
  );
}
