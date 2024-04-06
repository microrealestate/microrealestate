import { DashboardCard } from '../dashboard/DashboardCard';
import NumberFormat from '../NumberFormat';
import { ReceiptTextIcon } from 'lucide-react';
import { Separator } from '../ui/separator';
import { StoreContext } from '../../store';
import { useContext } from 'react';
import useTranslation from 'next-translate/useTranslation';

export default function RentOverviewCard() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  return (
    <DashboardCard
      Icon={ReceiptTextIcon}
      title={t('Rental')}
      renderContent={() => (
        <div className="text-base">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('Rent')}</span>
            <NumberFormat value={store.tenant.selected.rental} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('Expenses')}</span>
            <NumberFormat value={store.tenant.selected.expenses} />
          </div>
          {store.tenant.selected.discount > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Discount')}</span>
              <NumberFormat value={store.tenant.selected.discount * -1} />
            </div>
          ) : null}
          {store.tenant.selected.isVat && (
            <>
              <Separator />
              <div mt={1}>
                <span className="text-muted-foreground">
                  {t('Pre-tax total')}
                </span>
                <NumberFormat value={store.tenant.selected.preTaxTotal} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('VAT')}</span>
                <NumberFormat value={store.tenant.selected.vat} />
              </div>
            </>
          )}
          <Separator />
          <div className="flex justify-between mt-4">
            <span className="text-muted-foreground">{t('Total')}</span>
            <NumberFormat value={store.tenant.selected.total} />
          </div>
        </div>
      )}
    />
  );
}
