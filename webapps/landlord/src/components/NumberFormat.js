import { cn } from '../utils';
import useFormatNumber from '../hooks/useFormatNumber';

export default function NumberFormat({
  value: rawValue,
  minimumFractionDigits = 2,
  style = 'currency',
  withColor,
  debitColor,
  creditColor,
  abs = false,
  showZero = false,
  className
}) {
  const formatNumber = useFormatNumber();

  const baseClassName = cn('whitespace-nowrap', className);
  if (rawValue === undefined || rawValue === null || Number.isNaN(rawValue)) {
    return (
      <div className={cn('text-muted-foreground', baseClassName)}>
        {formatNumber(0, style, minimumFractionDigits).replaceAll('0', '-')}
      </div>
    );
  }

  const value = abs ? Math.abs(rawValue) : rawValue;
  if (rawValue === 0) {
    return (
      <div className={baseClassName}>
        {showZero ? formatNumber(value, style, minimumFractionDigits) : '--'}
      </div>
    );
  }

  if ((withColor && rawValue < 0) || debitColor) {
    return (
      <div className={cn('text-warning', baseClassName)}>
        {formatNumber(value, style, minimumFractionDigits)}
      </div>
    );
  }

  if ((withColor && rawValue >= 0) || creditColor) {
    return (
      <div className={cn('text-success', baseClassName)}>
        {formatNumber(value, style, minimumFractionDigits)}
      </div>
    );
  }

  return (
    <div className={baseClassName}>
      {formatNumber(value, style, minimumFractionDigits)}
    </div>
  );
}
