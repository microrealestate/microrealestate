import { Card, CardHeader, CardTitle } from '../ui/card';
import { DownloadIcon, ReceiptTextIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { CardContent } from '@material-ui/core';
import { cn } from '../../utils';
import { EmptyIllustration } from '../Illustrations';
import moment from 'moment';
import NumberFormat from '../NumberFormat';
import { StoreContext } from '../../store';
import { useContext } from 'react';
import useTranslation from 'next-translate/useTranslation';

const months = moment.localeData().months();

function SettlementList({ month, tenantId, settlements }) {
  const { t } = useTranslation('common');

  const hasSettlements = !!settlements?.length;
  const monthName = months[month][0].toUpperCase() + months[month].slice(1);
  return (
    <div className={cn('grid grid-cols-5 border-b first:border-t')}>
      <div className="text-muted-foreground md:text-lg border-l border-r col-span-2 md:col-span-2 px-4 py-2">
        {monthName}
      </div>
      <div
        className={cn(
          'flex flex-col gap-2 items-center justify-end col-span-3 px-4 py-2 border-r md:flex-row md:col-span-3 md:gap-8',
          !hasSettlements ? 'bg-muted' : ''
        )}
      >
        {hasSettlements
          ? settlements.map((settlement, index) => {
              const { date, amount, type } = settlement;
              return amount > 0 ? (
                <div
                  key={`${tenantId}_${month}_${index}`}
                  className="text-right"
                >
                  <div>{moment(date).format('L')}</div>
                  <div>{t(type[0].toUpperCase() + type.slice(1))}</div>
                  <div className="text-2xl">
                    <NumberFormat value={amount} withColor />
                  </div>
                </div>
              ) : null;
            })
          : null}
      </div>
    </div>
  );
}

export default function TenantSettlements({
  onCSVClick,
  onDownloadYearInvoices
}) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const hasData = !!store.accounting?.filteredData?.settlements?.length;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center text-lg md:text-xl">
          {t('Settlements')}
          <Button variant="secondary" onClick={onCSVClick}>
            <DownloadIcon />
          </Button>
        </CardTitle>
      </CardHeader>
      {hasData ? (
        <CardContent>
          {store.accounting.filteredData.settlements.map((settlement) => (
            <div
              key={settlement.tenantId}
              className="border-b first:border-t last:border-none py-4"
            >
              <div className="flex justify-between text-xl px-2">
                <div>{settlement.tenant}</div>
                <Button
                  variant="secondary"
                  onClick={onDownloadYearInvoices({
                    _id: settlement.tenantId,
                    name: settlement.tenant
                  })}
                >
                  <ReceiptTextIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-muted-foreground mb-2">
                {moment(settlement.beginDate).format('L')} -{' '}
                {moment(settlement.endDate).format('L')}
              </div>
              <div>
                {months.map((m, index) => {
                  return (
                    <SettlementList
                      key={`${settlement.tenantId}_${index}`}
                      tenantId={settlement.tenantId}
                      month={index}
                      settlements={settlement.settlements[index]}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      ) : (
        <EmptyIllustration />
      )}
    </Card>
  );
}
