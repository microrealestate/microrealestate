import { Card } from '@microrealestate/commonui/components/ui/card';
import { Checkbox } from '@microrealestate/commonui/components/ui/checkbox';
import { cn } from '@microrealestate/commonui/utils';
import { useTranslations } from 'next-intl';
import MobileRentRow from './MobileRentRow';
import { useCanSendEmails } from './SendEmailGate';

export default function MobileRentTable({
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
    <Card className={cn('py-4 px-0 space-y-6', className)}>
      {canSendEmails ? (
        <div className="ml-4">
          <Checkbox
            checked={
              selected.length > 0 && selected.length < selectableCount
                ? 'intermediate'
                : selected.length === selectableCount
            }
            onCheckedChange={onSelectAll}
            aria-labelledby={t('select all rents')}
          />
        </div>
      ) : null}
      <div className="flex flex-col">
        {rents.map((rent) => {
          const isItemSelected = selected.map((r) => r._id).includes(rent._id);
          return (
            <MobileRentRow
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
      </div>
    </Card>
  );
}
