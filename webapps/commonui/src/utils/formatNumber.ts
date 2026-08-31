export const DEFAULT_CURRENCY = 'USD';

export function formatNumber(
  locale: string,
  currency: string,
  value: number,
  minimumFractionDigits: number = 2,
  showSign = false
): string {
  return Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency || DEFAULT_CURRENCY,
    minimumFractionDigits,
    signDisplay: showSign ? 'exceptZero' : 'auto'
  }).format(value);
}
