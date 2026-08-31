import { Button } from '@microrealestate/commonui/components/ui/button';
import { Checkbox } from '@microrealestate/commonui/components/ui/checkbox';
import { useTranslations } from 'next-intl';
import { RiMailSendLine } from 'react-icons/ri';
import { ReceiptDocumentIcon } from './DocumentIcon';
import MobileRentActions from './MobileRentActions';
import RentAmount from './RentAmount';
import { getRentAmounts } from './RentDetails';
import RentPayment from './RentPayment';
import {
  SendEmailPopover,
  useCanSendEmails,
  useSendEmailDisabledReason
} from './SendEmailGate';

export default function MobileRentRow({
  rent,
  isSelected,
  onSelect,
  onPay,
  onSend,
  onHistory
}) {
  const t = useTranslations('common');
  const rentAmounts = getRentAmounts(rent);
  const canSendEmails = useCanSendEmails();
  const sendEmailDisabledReason = useSendEmailDisabledReason(rent);
  let countEmailSent = 0;
  if (rent?.emailStatus?.count) {
    countEmailSent =
      rent.emailStatus.count.allRentnotice + rent.emailStatus.count.receipt;
  }

  return (
    <div className="p-4 space-y-4 odd:bg-primary/5 odd:border-t odd:border-b">
      <div className="flex items-center gap-2">
        {canSendEmails ? (
          <SendEmailPopover reason={sendEmailDisabledReason}>
            <Checkbox
              checked={isSelected}
              disabled={!!sendEmailDisabledReason}
              onCheckedChange={onSelect(rent)}
              aria-labelledby={rent.occupant.name}
            />
          </SendEmailPopover>
        ) : null}
        <Button
          variant="link"
          className="p-0 w-fit h-fit whitespace-normal text-left text-xl"
          onClick={() => onPay(rent)}
        >
          {rent.occupant.name}
        </Button>
      </div>
      <div className="flex text-xl px-2 py-4">
        <div
          data-cy="rent-due"
          data-cy-amount={rentAmounts.absNewBalance}
          className="w-full"
        >
          <RentAmount
            label={
              rentAmounts.newBalance === 0 || rentAmounts.isDebitNewBalance
                ? t('Rent due')
                : t('Rent overpayment')
            }
            amount={rentAmounts.absNewBalance}
            withColor={false}
            debitColor={rentAmounts.isDebitNewBalance}
            creditColor={
              !rentAmounts.isDebitNewBalance && rentAmounts.newBalance !== 0
            }
            className="text-center w-full"
          />
        </div>

        <div
          data-cy="rent-payment"
          data-cy-amount={rentAmounts.payment}
          className="flex items-center justify-center gap-2 w-full"
        >
          <RentPayment
            id={rent._id}
            amount={rentAmounts.payment}
            references={rentAmounts.paymentReferences}
            variant="right"
            withLabel
          />
        </div>
      </div>

      <div className="flex justify-between w-full">
        <div className="flex items-center text-xs text-muted-foreground">
          {countEmailSent > 0 ? (
            <div className="flex items-center gap-1">
              {countEmailSent}
              <RiMailSendLine className="size-3.5" />
              {rent.emailStatus.receipt ? (
                <ReceiptDocumentIcon type="receipt" className="text-success" />
              ) : null}
            </div>
          ) : null}
        </div>
        <MobileRentActions
          rent={rent}
          onPay={onPay}
          onSend={onSend}
          onHistory={onHistory}
        />
      </div>
    </div>
  );
}
