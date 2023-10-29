import { cn } from '@/utils';
import { Label } from '@/components/ui/label';

export function LabelValue({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn(`flex flex-col gap-2 ${className}`)}>
      <Label>{label}</Label>
      <div className="text-base">{value}</div>
    </div>
  );
}
