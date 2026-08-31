import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@microrealestate/commonui/components/ui/card';
import { cn } from '@microrealestate/commonui/utils';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { GrDocumentCsv } from 'react-icons/gr';
import { LuPaperclip } from 'react-icons/lu';
import { useStore } from '@/providers/StoreProvider';
import { EmptyIllustration } from '../Illustrations';
import RentPayment from '../rents/RentPayment';

const months = moment.localeData().months();

function SettlementList({ month, tenantId, settlements }) {
  const hasSettlements = !!settlements?.length;
  const monthName = months[month][0].toUpperCase() + months[month].slice(1);
  return (
    <div className={cn('grid grid-cols-5 border-b first:border-t')}>
      <div className="text-muted-foreground md:text-lg border-l border-r col-span-2 md:col-span-2 px-4 py-2">
        {monthName}
      </div>
      <div
        className={cn(
          'col-span-3 flex flex-col gap-4 justify-end px-4 py-2 border-r',
          !hasSettlements ? 'bg-muted' : ''
        )}
      >
        {hasSettlements
          ? settlements.map((settlement, index) => {
              const { date, amount, type, reference } = settlement;
              const id = `${tenantId}_${month}_${index}`;
              return amount > 0 ? (
                <div key={id} className="text-right pb-3.5">
                  <div>{moment(date, 'DD/MM/YYYY').format('L')}</div>
                  <RentPayment
                    id={id}
                    amount={amount}
                    references={[{ type, reference }]}
                    withReference
                    className="text-xl"
                  />
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
  onDownloadYearReceipts
}) {
  const t = useTranslations('common');
  const store = useStore();
  const hasData = !!store.accounting?.filteredData?.settlements?.length;
  return hasData ? (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center text-lg md:text-xl">
          {t('Payments')}
          <Button variant="outline" size="icon" onClick={onCSVClick}>
            <GrDocumentCsv className="size-6" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {store.accounting.filteredData.settlements.map((settlement) => (
          <div
            key={settlement.tenantId}
            className="border-b first:border-t last:border-none py-4"
          >
            <div className="flex justify-between text-xl px-2">
              <div>{settlement.tenant}</div>
              <Button
                variant="outline"
                className="flex items-center gap-1"
                onClick={onDownloadYearReceipts({
                  _id: settlement.tenantId,
                  name: settlement.tenant
                })}
              >
                <LuPaperclip /> {t('Receipts')}
              </Button>
            </div>
            <div className="text-muted-foreground mb-2">
              {moment(settlement.beginDate).format('L')} -{' '}
              {moment(settlement.endDate).format('L')}
            </div>
            <div>
              {months.map((_, index) => {
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
    </Card>
  ) : (
    <EmptyIllustration />
  );
}
