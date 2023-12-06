import { cn } from '@/utils';
import { Label } from '@/components/ui/label';

export async function AmountValue({
  label,
  value,
  variant,
  className,
}: {
  label: string;
  value: string;
  variant?: 'destructive' | 'success';
  className?: string;
}) {
  let amountClass = 'text-2xl font-semibold';

  if (variant === 'success') {
    amountClass += ' text-green-600';
  } else if (variant === 'destructive') {
    amountClass += ' text-red-600';
  }

  return (
    <div className={cn(`flex flex-col gap-2 ${className}`)}>
      <Label>{label}</Label>
      <div className={cn(amountClass)}>{value}</div>
    </div>
  );
}
