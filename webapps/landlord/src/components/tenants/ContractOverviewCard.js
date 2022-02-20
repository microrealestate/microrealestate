import { CardRow, PageInfoCard } from '../Cards';
import { Typography, withStyles } from '@material-ui/core';

import moment from 'moment';
import { NumberFormat } from '../../utils/numberformat';
import { StoreContext } from '../../store';
import SubjectIcon from '@material-ui/icons/Subject';
import { useContext } from 'react';
import useTranslation from 'next-translate/useTranslation';

const WarningTypography = withStyles((theme) => {
  return {
    root: {
      color: theme.palette.warning.dark,
    },
  };
})(Typography);

export default function ContractOverview() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  return (
    <PageInfoCard Icon={SubjectIcon} title={t('Lease')}>
      <CardRow>
        <Typography color="textSecondary" noWrap>
          {t('Contract')}
        </Typography>
        <Typography color="textSecondary" noWrap>
          {store.tenant.selected.contract}
        </Typography>
      </CardRow>
      <CardRow>
        <Typography color="textSecondary" noWrap>
          {t('Status')}
        </Typography>
        {store.tenant.selected.terminated ? (
          <WarningTypography color="textSecondary" noWrap>
            {t('Terminated')}
          </WarningTypography>
        ) : (
          <Typography color="textSecondary" noWrap>
            {t('In progress')}
          </Typography>
        )}
      </CardRow>
      {store.tenant.selected.beginDate && (
        <CardRow>
          <Typography color="textSecondary" noWrap>
            {t('Start date')}
          </Typography>
          <Typography color="textSecondary" noWrap>
            {moment(store.tenant.selected.beginDate, 'DD/MM/YYYY').format('L')}
          </Typography>
        </CardRow>
      )}
      {(store.tenant.selected.terminationDate ||
        store.tenant.selected.endDate) && (
        <CardRow>
          <Typography color="textSecondary" noWrap>
            {t('End date')}
          </Typography>
          <Typography color="textSecondary" noWrap>
            {moment(
              store.tenant.selected.terminationDate ||
                store.tenant.selected.endDate,
              'DD/MM/YYYY'
            ).format('L')}
          </Typography>
        </CardRow>
      )}
      <CardRow>
        <Typography color="textSecondary" variant="h5" noWrap>
          {t('Deposit')}
        </Typography>
        <NumberFormat
          color="textSecondary"
          variant="h5"
          value={store.tenant.selected.guaranty}
          noWrap
        />
      </CardRow>
    </PageInfoCard>
  );
}
