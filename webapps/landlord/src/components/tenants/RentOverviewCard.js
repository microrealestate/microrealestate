import { CardRow, PageInfoCard } from '../Cards';

import { Divider } from '@material-ui/core';
import NumberFormat from '../NumberFormat';
import ReceiptIcon from '@material-ui/icons/Receipt';
import { StoreContext } from '../../store';
import { useContext } from 'react';
import useTranslation from 'next-translate/useTranslation';

export default function RentOverview() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  return (
    <PageInfoCard Icon={ReceiptIcon} title={t('Rental')}>
      <CardRow>
        {t('Rent')}
        <NumberFormat
          color="text.secondary"
          value={store.tenant.selected.rental}
        />
      </CardRow>
      <CardRow>
        {t('Expenses')}
        <NumberFormat
          color="text.secondary"
          value={store.tenant.selected.expenses}
        />
      </CardRow>
      {store.tenant.selected.discount > 0 ? (
        <CardRow>
          {t('Discount')}
          <NumberFormat
            color="text.secondary"
            value={store.tenant.selected.discount * -1}
          />
        </CardRow>
      ) : null}
      {store.tenant.selected.isVat && (
        <>
          <Divider />
          <CardRow mt={1}>
            {t('Pre-tax total')}
            <NumberFormat
              color="text.secondary"
              value={store.tenant.selected.preTaxTotal}
            />
          </CardRow>
          <CardRow>
            {t('VAT')}
            <NumberFormat
              color="text.secondary"
              value={store.tenant.selected.vat}
            />
          </CardRow>
        </>
      )}
      <Divider />
      <CardRow mt={1}>
        {t('Total')}
        <NumberFormat value={store.tenant.selected.total} />
      </CardRow>
    </PageInfoCard>
  );
}
