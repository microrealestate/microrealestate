import {} from '@/mocks/session/server/getServerSession';
import { cn } from '@/utils';
import { getFormatNumber } from '@/utils/formatnumber/server/getFormatNumber';
import { Label } from '@/components/ui/label';

export async function AmountValue({
  className,
  label,
  amount,
  variant,
}: {
  className?: string;
  label: string;
  amount: number;
  variant?: 'colored';
}) {
  const formatNumber = await getFormatNumber();

  let amountClass = 'text-2xl font-semibold';
  if (variant === 'colored') {
    if (amount > 0) {
      amountClass += ' text-green-600';
    } else if (amount < 0) {
      amountClass += ' text-red-600';
    }
  }

  return (
    <div className={cn(`flex flex-col gap-2 ${className}`)}>
      <Label>{label}</Label>
      <div className={cn(amountClass)}>{formatNumber({ value: amount })}</div>
    </div>
  );
}
