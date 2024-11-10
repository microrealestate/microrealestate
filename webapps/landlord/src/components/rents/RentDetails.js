import { cn } from '../../utils';
import NumberFormat from '../NumberFormat';
import { Separator } from '../ui/separator';
import useTranslation from 'next-translate/useTranslation';

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

export function RentAmount({
  label,
  amount,
  creditColor,
  debitColor,
  withColor = true,
  className
}) {
  return (
    <div className={cn('flex flex-col text-right', className)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <NumberFormat
        value={amount}
        align="right"
        creditColor={creditColor}
        debitColor={debitColor}
        withColor={withColor}
      />
    </div>
  );
}

export default function RentDetails({ rent }) {
  const { t } = useTranslation('common');

  const rentAmounts = getRentAmounts(rent);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
        {rentAmounts.balance === 0
          ? t('Previous balance')
          : rentAmounts.isDebitBalance
            ? t('Previous debit balance')
            : t('Previous credit balance')}
        <NumberFormat
          value={rentAmounts.balance}
          debitColor={rentAmounts.isDebitBalance}
          creditColor={!rentAmounts.isDebitBalance}
        />
      </div>
      <div className="flex justify-between">
        {t('Rent')}
        <NumberFormat value={rentAmounts.rent} />
      </div>
      <div className="flex justify-between">
        {t('Additional costs')}
        <NumberFormat value={rentAmounts.additionalCosts} />
      </div>
      <div className="flex justify-between">
        {t('Discount')}
        <NumberFormat value={rentAmounts.discount} />
      </div>
      <Separator />
      <div className="flex justify-between">
        {t('Total to pay')}
        <NumberFormat value={rentAmounts.totalAmount} />
      </div>
      <div className="flex justify-between">
        {t('Settlements')}
        <NumberFormat value={rentAmounts.payment} withColor />
      </div>
      <Separator />
      <div className="flex justify-between">
        {rentAmounts.newBalance === 0
          ? t('Balance')
          : rentAmounts.isDebitNewBalance
            ? t('Debit balance')
            : t('Credit balance')}
        <NumberFormat
          value={rentAmounts.newBalance}
          abs={true}
          debitColor={rentAmounts.isDebitNewBalance}
          creditColor={!rentAmounts.isDebitNewBalance}
        />
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        <div>{t('Note')}</div>
        <div className="h-14 break-words overflow-y-auto">
          {rent.description}
        </div>
      </div>
    </div>
  );
}
