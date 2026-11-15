import { Progress } from '@microrealestate/commonui/components/ui/progress';
import { useFormatNumber } from '@microrealestate/commonui/providers/CurrencyProvider';
import { cn } from '@microrealestate/commonui/utils';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { LuCheck } from 'react-icons/lu';
import usePaymentTypes from '../../hooks/usePaymentTypes';
import PaymentIcon from '../payment/PaymentIcon';
import { RentStatusBadge } from './RentCells';
import { getRentAmounts } from './RentDetails';
import { leftToPay, paidPercent } from './rentView';
import type { MonthRent } from './types';

function Line({
  label,
  note,
  amount,
  deducted = false,
  strong = false,
  ...props
}: {
  label: ReactNode;
  note?: string;
  amount: number;
  deducted?: boolean;
  strong?: boolean;
} & Record<`data-${string}`, string | number>) {
  const formatNumber = useFormatNumber();
  return (
    <div
      className={cn(
        'flex justify-between gap-4 py-1.5',
        strong && 'font-semibold'
      )}
      {...props}
    >
      <div className="min-w-0">
        <div>{label}</div>
        {note ? (
          <div className="text-sm text-muted-foreground whitespace-pre-line md:text-xs">
            {note.trim()}
          </div>
        ) : null}
      </div>
      <span
        className={cn(
          'tabular-nums whitespace-nowrap',
          deducted && 'text-success'
        )}
      >
        {formatNumber(Math.abs(amount))}
      </span>
    </div>
  );
}

export function RentBalanceSummary({ rent }: { rent: MonthRent }) {
  const t = useTranslations('common');
  const formatNumber = useFormatNumber();
  const left = leftToPay(rent);
  const percent = paidPercent(rent);

  return (
    <div
      className="rounded-lg border bg-muted/40 p-4"
      data-cy="rent-balance"
      data-cy-amount={rent.newBalance}
    >
      <div className="flex items-start justify-between gap-3">
        {left > 0 ? (
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              {t('Left to pay')}
            </div>
            <div className="text-3xl font-bold tabular-nums whitespace-nowrap md:text-2xl">
              {formatNumber(left)}
            </div>
          </div>
        ) : left < 0 ? (
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              {t('Tenant credit')}
            </div>
            <div className="text-3xl font-bold tabular-nums whitespace-nowrap text-success md:text-2xl">
              {formatNumber(-left)}
            </div>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 text-lg font-semibold text-success">
            <LuCheck className="size-5" />
            {t('Paid in full')}
          </div>
        )}
        <RentStatusBadge rent={rent} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Progress
          value={percent}
          className="h-2 flex-1"
          indicatorClassName={percent >= 100 ? 'bg-success' : 'bg-warning'}
          aria-hidden="true"
        />
        <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap md:text-xs">
          {t('{percent}% paid', { percent })}
        </span>
      </div>
    </div>
  );
}

export function RentCharges({ rent }: { rent: MonthRent }) {
  const t = useTranslations('common');
  const amounts = getRentAmounts(rent);

  return (
    <div className="text-base md:text-sm">
      {amounts.balance !== 0 ? (
        <Line
          label={
            amounts.isDebitBalance
              ? t('Unpaid from previous months')
              : t('Credit from previous months')
          }
          amount={amounts.balance}
          deducted={!amounts.isDebitBalance}
        />
      ) : null}
      <Line label={t('Rent and charges')} amount={amounts.rent} />
      {amounts.additionalCosts > 0 ? (
        <Line
          label={t('Additional cost')}
          note={rent.noteextracharge}
          amount={amounts.additionalCosts}
        />
      ) : null}
      {amounts.discount !== 0 ? (
        <Line
          label={t('Discount')}
          note={rent.notepromo}
          amount={amounts.discount}
          deducted
        />
      ) : null}

      <div className="my-1.5 border-t" />
      <Line
        label={amounts.isOverpaid ? t('Tenant credit') : t('Total to pay')}
        amount={amounts.totalAmount}
        deducted={amounts.isOverpaid}
        strong
        data-cy="rent-total"
        data-cy-amount={amounts.totalAmount}
      />
    </div>
  );
}

export function RentPayments({ rent }: { rent: MonthRent }) {
  const t = useTranslations('common');
  const formatNumber = useFormatNumber();
  const { itemList: paymentTypes } = usePaymentTypes();
  const methodLabel = (type: string) =>
    paymentTypes.find(({ value }) => value === type)?.label ?? t('Other');

  if (!rent.payments?.length) {
    return (
      <div className="py-1.5 text-base text-muted-foreground md:text-sm">
        {t('No payment recorded for this month.')}
      </div>
    );
  }

  return (
    <div className="divide-y text-base md:divide-y-0 md:text-sm">
      {rent.payments.map((payment, index) => (
        <div
          key={`${payment.type}-${index}`}
          className="flex items-center justify-between gap-4 py-2 md:py-1.5"
          data-cy="rentPayment"
          data-cy-date={moment(payment.date).format('YYYY-MM-DDTHH:mm')}
          data-cy-reference={payment.reference ?? ''}
          data-cy-amount={payment.amount}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-muted md:size-7"
              title={methodLabel(payment.type)}
            >
              <PaymentIcon type={payment.type} className="size-4" />
            </span>
            <div className="min-w-0">
              <div>
                {t('Payment on {date}', {
                  date: moment(payment.date).format('ll')
                })}
              </div>
              <div className="truncate text-sm text-muted-foreground md:text-xs">
                {methodLabel(payment.type)}
                {payment.reference ? <span> · {payment.reference}</span> : null}
              </div>
            </div>
          </div>
          <span className="tabular-nums whitespace-nowrap text-success">
            {formatNumber(Math.abs(payment.amount))}
          </span>
        </div>
      ))}
    </div>
  );
}
