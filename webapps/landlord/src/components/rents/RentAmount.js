import { cn } from '@microrealestate/commonui/utils';
import NumberFormat from '../NumberFormat';

export default function RentAmount({
  label,
  amount,
  creditColor,
  debitColor,
  withColor = true,
  labelBelow = false,
  className
}) {
  return (
    <div
      className={cn(
        'flex flex-col text-right',
        labelBelow && 'relative',
        className
      )}
    >
      <div
        className={cn(
          'text-xs text-muted-foreground',
          labelBelow && 'absolute inset-x-0 top-full leading-none'
        )}
      >
        {label}
      </div>
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
