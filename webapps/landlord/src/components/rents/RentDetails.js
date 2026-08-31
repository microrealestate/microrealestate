import { Separator } from '@microrealestate/commonui/components/ui/separator';
import { cn } from '@microrealestate/commonui/utils';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import NumberFormat from '../NumberFormat';
import PaymentIcon from '../payment/PaymentIcon';

export function getRentAmounts(rent) {
  const turnToNegative = (amount) => (amount !== 0 ? amount * -1 : 0);

  return {
    balance: rent.balance,
    absBalance: Math.abs(rent.balance),
    isDebitBalance: turnToNegative(rent.balance) < 0,
    newBalance: rent.newBalance,
    absNewBalance: Math.abs(rent.newBalance),
    isDebitNewBalance: rent.newBalance < 0,
    additionalCosts: rent.extracharge,
    rent: rent.totalWithoutBalanceAmount + rent.promo - rent.extracharge,
    discount: turnToNegative(rent.promo),
    payment: rent.payment,
    paymentReferences:
      rent.payments?.map(({ type, reference }) => ({
        type,
        reference
      })) || [],
    totalAmount: rent.totalAmount
  };
}

function DetailLabel({ children, className }) {
  return (
    <div className={cn('text-muted-foreground', className)}>{children}</div>
  );
}
export default function RentDetails({ rent, className }) {
  const t = useTranslations('common');
  const rentAmounts = getRentAmounts(rent);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex justify-between">
        <DetailLabel>
          {rentAmounts.balance === 0
            ? t('Previous balance')
            : rentAmounts.isDebitBalance
              ? t('Previous debit balance')
              : t('Previous credit balance')}
        </DetailLabel>
        <NumberFormat
          value={rentAmounts.balance}
          debitColor={rentAmounts.isDebitBalance}
          creditColor={!rentAmounts.isDebitBalance}
        />
      </div>
      <div className="flex justify-between">
        <DetailLabel>{t('Rent')}</DetailLabel>
        <NumberFormat value={rentAmounts.rent} />
      </div>
      {rentAmounts.additionalCosts > 0 ? (
        <>
          <DetailLabel>{t('Additional costs')}</DetailLabel>
          <div className="flex justify-between">
            <div className="px-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              {rent.noteextracharge}
            </div>
            <NumberFormat
              value={rentAmounts.additionalCosts}
              debitColor={true}
            />
          </div>
        </>
      ) : (
        <div className="flex justify-between">
          <DetailLabel>{t('Additional costs')}</DetailLabel>
          <NumberFormat value={rentAmounts.additionalCosts} />
        </div>
      )}
      {rentAmounts.discount < 0 ? (
        <>
          <DetailLabel>{t('Discount')}</DetailLabel>
          <div className="flex justify-between">
            <div className="px-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              {rent.notepromo}
            </div>
            <NumberFormat value={rentAmounts.discount} creditColor={true} />
          </div>
        </>
      ) : (
        <div className="flex justify-between">
          <DetailLabel>{t('Discount')}</DetailLabel>
          <NumberFormat value={rentAmounts.discount} />
        </div>
      )}

      <Separator />
      <div
        className="flex justify-between"
        data-cy="rent-total"
        data-cy-amount={rentAmounts.totalAmount}
      >
        <DetailLabel>{t('Total to pay')}</DetailLabel>
        <NumberFormat value={rentAmounts.totalAmount} />
      </div>
      {rent.payments?.length ? (
        <>
          <DetailLabel>{t('Payments')}</DetailLabel>
          {rent.payments.map((payment, id) => {
            const formattedDate = moment(payment.date).format('l');
            return (
              <div
                key={`${payment.type}-${id}`}
                className="flex justify-between"
                data-cy="rentPayment"
                data-cy-date={moment(payment.date).format('YYYY-MM-DDTHH:mm')}
                data-cy-reference={payment.reference}
                data-cy-amount={payment.amount}
              >
                <div className="px-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <PaymentIcon type={payment.type} className="size-4" />
                  <div>
                    {formattedDate} {payment.reference}
                  </div>
                </div>
                <NumberFormat value={payment.amount * -1} creditColor={true} />
              </div>
            );
          })}
        </>
      ) : (
        <div
          className="flex justify-between"
          data-cy="rent-settlements"
          data-cy-amount={rentAmounts.payment}
        >
          <DetailLabel>{t('Payments')}</DetailLabel>
          <NumberFormat value={rentAmounts.payment} withColor />
        </div>
      )}
      <Separator />
      <div
        className="flex justify-between"
        data-cy="rent-balance"
        data-cy-amount={rentAmounts.newBalance}
      >
        <DetailLabel>
          {rentAmounts.newBalance === 0
            ? t('Balance')
            : rentAmounts.isDebitNewBalance
              ? t('Rent due')
              : t('Rent overpayment')}
        </DetailLabel>
        <NumberFormat
          value={rentAmounts.newBalance}
          abs={true}
          debitColor={rentAmounts.isDebitNewBalance}
          creditColor={!rentAmounts.isDebitNewBalance}
        />
      </div>
      <Separator />
      <div className="flex flex-col">
        <DetailLabel>{t('Note')}</DetailLabel>
        <div className="h-14 break-words overflow-y-auto px-1.5 text-xs">
          {rent.description}
        </div>
      </div>
    </div>
  );
}
