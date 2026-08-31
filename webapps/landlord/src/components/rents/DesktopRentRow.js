import { Checkbox } from '@microrealestate/commonui/components/ui/checkbox';
import {
  TableCell,
  TableRow
} from '@microrealestate/commonui/components/ui/table';
import { cn } from '@microrealestate/commonui/utils';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { RiMailSendLine } from 'react-icons/ri';
import FoldUnfold from '../FoldUnfold';
import Status from '../Status';
import DesktopRentActions from './DesktopRentActions';
import RentAmount from './RentAmount';
import RentAttachedDocuments from './RentAttachedDocuments';
import RentDetails, { getRentAmounts } from './RentDetails';
import RentPayment from './RentPayment';
import {
  SendEmailPopover,
  useCanSendEmails,
  useSendEmailDisabledReason
} from './SendEmailGate';

export default function DesktopRentRow({
  rent,
  isSelected,
  onSelect,
  onPay,
  onSend,
  onHistory
}) {
  const t = useTranslations('common');
  const [showExtendedRow, setShowExtendedRow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const rentAmounts = getRentAmounts(rent);
  const canSendEmails = useCanSendEmails();
  const sendEmailDisabledReason = useSendEmailDisabledReason(rent);
  let countEmailSent = 0;
  if (rent?.emailStatus?.count) {
    countEmailSent =
      rent.emailStatus.count.allRentnotice + rent.emailStatus.count.receipt;
  }
  return (
    <>
      <TableRow
        className={cn(
          'min-h-15 cursor-pointer text-xs lg:text-sm xl:text-base',
          expanded
            ? 'hover:bg-transparent border-primary border-2 border-b-0'
            : 'border-b'
        )}
      >
        {canSendEmails ? (
          <TableCell>
            <SendEmailPopover reason={sendEmailDisabledReason}>
              <Checkbox
                checked={isSelected}
                disabled={!!sendEmailDisabledReason}
                onCheckedChange={onSelect(rent)}
                aria-labelledby={rent.occupant.name}
              />
            </SendEmailPopover>
          </TableCell>
        ) : null}
        <TableCell onClick={() => setExpanded(!expanded)}>
          <div className="relative flex items-center">
            <div className="text-wrap">{rent.occupant.name}</div>
            {countEmailSent > 0 ? (
              <div className="absolute -bottom-4 left-0 text-xs text-muted-foreground w-full">
                <div className="inline-flex items-center gap-0.5">
                  {countEmailSent}
                  <RiMailSendLine />
                  {rent.emailStatus.receipt ? (
                    <span className="ml-1 text-success whitespace-nowrap">
                      {t('Receipt sent')}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </TableCell>
        <TableCell
          data-cy="rent-due"
          data-cy-amount={rentAmounts.absNewBalance}
          onClick={() => setExpanded(!expanded)}
        >
          <RentAmount
            label={
              !rentAmounts.isDebitNewBalance && rentAmounts.newBalance !== 0
                ? t('Rent overpayment')
                : undefined
            }
            labelBelow
            amount={rentAmounts.absNewBalance}
            withColor={false}
            debitColor={rentAmounts.isDebitNewBalance}
            creditColor={
              !rentAmounts.isDebitNewBalance && rentAmounts.newBalance !== 0
            }
          />
        </TableCell>
        <TableCell
          data-cy="rent-payment"
          data-cy-amount={rentAmounts.payment}
          onClick={() => setExpanded(!expanded)}
        >
          <RentPayment
            id={rent.id}
            amount={rentAmounts.payment}
            references={rentAmounts.paymentReferences}
          />
        </TableCell>
        <TableCell
          className="text-center"
          data-cy="rent-status"
          data-cy-value={rent.status}
          onClick={() => setExpanded(!expanded)}
        >
          {rent.status === 'paid' && (
            <Status variant="success">{t('Paid')}</Status>
          )}
          {rent.status === 'partiallypaid' && (
            <Status variant="warning">{t('Paid')}</Status>
          )}
          {rent.status === 'notpaid' && (
            <Status variant="default">{t('Not paid')}</Status>
          )}
        </TableCell>
        <TableCell className="pl-0.5 py-0.5">
          <DesktopRentActions
            rent={rent}
            onPay={onPay}
            onSend={onSend}
            onHistory={onHistory}
          />
        </TableCell>
      </TableRow>
      <TableRow
        className={cn(
          'text-xs lg:text-sm xl:text-base',
          showExtendedRow ? '' : 'hidden',
          expanded
            ? 'hover:bg-transparent border-primary border-2 border-t-0 last:border-primary! last:border-2! last:border-t-0!'
            : 'border-b'
        )}
      >
        <TableCell colSpan={8} className="p-0 pt-4">
          <FoldUnfold
            open={expanded}
            onAnimationEnd={() => setShowExtendedRow(expanded)}
          >
            <div className="grid grid-cols-2 gap-10 h-96 px-20">
              <div>
                <div className="mb-1.5">{t('Emails sent to tenant:')}</div>
                {!rent.occupant.hasContactEmails ? (
                  <div className="text-warning text-xs">
                    {t('No emails sent yet.')}
                  </div>
                ) : (
                  <RentAttachedDocuments
                    rent={rent}
                    className="border rounded p-4 h-[335px] overflow-y-auto"
                  />
                )}
              </div>
              <div>
                <div className="mb-1.5">{t('Rent details')}</div>
                <RentDetails
                  rent={rent}
                  className="border rounded p-4 h-[335px] overflow-y-auto"
                />
              </div>
            </div>
          </FoldUnfold>
        </TableCell>
      </TableRow>
    </>
  );
}
