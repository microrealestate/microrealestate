import { CardRow, PageInfoCard } from '../Cards';

import moment from 'moment';
import NumberFormat from '../NumberFormat';
import { StoreContext } from '../../store';
import SubjectIcon from '@material-ui/icons/Subject';
import { useContext } from 'react';
import useTranslation from 'next-translate/useTranslation';

export default function ContractOverview() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  return (
    <PageInfoCard Icon={SubjectIcon} title={t('Lease')}>
      <CardRow>
        {t('Contract')}
        {store.tenant.selected.contract}
      </CardRow>
      <CardRow>
        {t('Status')}
        {store.tenant.selected.terminated ? t('Terminated') : t('In progress')}
      </CardRow>
      {store.tenant.selected.beginDate && (
        <CardRow>
          {t('Start date')}
          {moment(store.tenant.selected.beginDate, 'DD/MM/YYYY').format('L')}
        </CardRow>
      )}
      {(store.tenant.selected.terminationDate ||
        store.tenant.selected.endDate) && (
        <CardRow>
          {t('End date')}
          {moment(
            store.tenant.selected.terminationDate ||
              store.tenant.selected.endDate,
            'DD/MM/YYYY'
          ).format('L')}
        </CardRow>
      )}
      <CardRow>
        {t('Deposit')}
        <NumberFormat value={store.tenant.selected.guaranty} />
      </CardRow>
    </PageInfoCard>
  );
}
