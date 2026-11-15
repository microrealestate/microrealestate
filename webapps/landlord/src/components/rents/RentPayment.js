import { cn } from '@microrealestate/commonui/utils';
import { useTranslations } from 'next-intl';
import PaymentIcon from '../payment/PaymentIcon';
import RentAmount from './RentAmount';

export default function RentPayment({
  id,
  amount,
  references,
  withLabel = false,
  withReference = false,
  variant = 'stacked',
  className
}) {
  const t = useTranslations('common');

  if (['left', 'right'].includes(variant)) {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-1',
          variant === 'right' ? 'flex-row-reverse' : '',
          className
        )}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          {references.map((reference, index) => (
            <div
              key={`${id}-${reference.type}-${index}`}
              className="flex items-center gap-0.5"
            >
              <PaymentIcon
                type={reference.type}
                className="size-4 text-muted-foreground"
              />
              {withReference && (
                <div className="text-xs text-muted-foreground">
                  {reference.reference}
                </div>
              )}
            </div>
          ))}
        </div>
        <RentAmount
          label={withLabel ? t('Payment') : null}
          amount={amount}
          withColor={false}
          creditColor={amount > 0}
          className={cn(amount > 0 ? 'font-medium' : '')}
        />
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <RentAmount
        label={withLabel ? t('Payment') : null}
        amount={amount}
        withColor={false}
        creditColor={amount > 0}
        className={cn(amount > 0 ? 'font-medium' : '')}
      />
      <div
        className={cn(
          'flex items-center',
          withReference
            ? 'mt-0.5 flex-wrap justify-end gap-x-2 gap-y-0.5'
            : 'absolute -bottom-4 right-0 gap-2'
        )}
      >
        {references.map((reference, index) => (
          <div
            key={`${id}-${reference.type}-${index}`}
            className={cn(
              'flex min-w-0',
              withReference
                ? 'flex-row-reverse items-start gap-1'
                : 'items-center gap-0.5'
            )}
          >
            <PaymentIcon
              type={reference.type}
              className={cn(
                'size-4 shrink-0 text-muted-foreground',
                withReference ? 'mt-px' : ''
              )}
            />
            {withReference && (
              <div className="min-w-0 wrap-break-word text-right text-xs text-muted-foreground">
                {reference.reference}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
