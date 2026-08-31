import { Card } from '@microrealestate/commonui/components/ui/card';
import { Checkbox } from '@microrealestate/commonui/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from '@microrealestate/commonui/components/ui/table';
import { cn } from '@microrealestate/commonui/utils';
import { useTranslations } from 'next-intl';
import DesktopRentRow from './DesktopRentRow';
import { useCanSendEmails } from './SendEmailGate';

export default function DesktopRentTable({
  rents,
  selected,
  selectableCount,
  onSelectAll,
  onSelectOne,
  onPay,
  onSend,
  onHistory,
  className
}) {
  const t = useTranslations('common');
  const canSendEmails = useCanSendEmails();

  return (
    <Card className={cn('p-6', className)}>
      <Table className="w-full">
        <TableHeader>
          <TableRow className="text-nowrap">
            {canSendEmails ? (
              <TableHead className="w-7">
                <Checkbox
                  checked={
                    selected.length > 0 && selected.length < selectableCount
                      ? 'intermediate'
                      : selected.length === selectableCount
                  }
                  onCheckedChange={onSelectAll}
                  aria-labelledby={t('select all rents')}
                />
              </TableHead>
            ) : null}
            <TableHead className="w-[40%]">{t('Tenant')}</TableHead>
            <TableHead className="text-right w-[20%]">
              {t('Rent due')}
            </TableHead>
            <TableHead className="text-right w-[20%]">{t('Payment')}</TableHead>
            <TableHead className="text-center w-[20%]">{t('Status')}</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rents.map((rent) => {
            const isItemSelected = selected
              .map((r) => r._id)
              .includes(rent._id);
            return (
              <DesktopRentRow
                key={`${rent._id}_${rent.term}`}
                rent={rent}
                isSelected={isItemSelected}
                onSelect={onSelectOne}
                onPay={onPay}
                onSend={onSend}
                onHistory={onHistory}
              />
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
