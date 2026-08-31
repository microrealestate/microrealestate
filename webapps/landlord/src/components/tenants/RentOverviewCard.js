import { Separator } from '@microrealestate/commonui/components/ui/separator';
import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import { BsReceipt } from 'react-icons/bs';
import { useStore } from '@/providers/StoreProvider';
import { DashboardCard } from '../dashboard/DashboardCard';
import NumberFormat from '../NumberFormat';

function RentOverviewCard() {
  const t = useTranslations('common');
  const store = useStore();
  const tenant = store.tenant.selected;

  return (
    <DashboardCard
      Icon={BsReceipt}
      title={t('Rental')}
      renderContent={() => (
        <div className="text-base space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('Rent')}</span>
            <NumberFormat value={tenant.rental} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('Charges')}</span>
            <NumberFormat value={tenant.expenses} />
          </div>
          {tenant.discount > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Discount')}</span>
              <NumberFormat value={tenant.discount * -1} />
            </div>
          ) : null}
          {tenant.isVat && (
            <>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t('Pre-tax total')}
                </span>
                <NumberFormat value={tenant.preTaxTotal} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('VAT')}</span>
                <NumberFormat value={tenant.vat} />
              </div>
            </>
          )}
          <Separator />
          <div className="flex justify-between mt-4">
            <span className="text-muted-foreground">{t('Total')}</span>
            <NumberFormat value={tenant.total} />
          </div>
        </div>
      )}
    />
  );
}

export default observer(RentOverviewCard);
