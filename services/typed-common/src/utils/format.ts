import { Locale } from '@microrealestate/types';

export function formatNumber(
  locale: Locale,
  value: number,
  style: 'decimal' | 'percent' = 'decimal',
  minimumFractionDigits = 2
) {
  if (style === 'decimal') {
    return Intl.NumberFormat(locale, {
      style,
      minimumFractionDigits,
    }).format(value);
  }

  if (style === 'percent') {
    return Number(value).toLocaleString(locale, {
      style: 'percent',
      minimumFractionDigits,
    });
  }

  return value;
}

export function formatCurrency(
  locale: Locale,
  currency: string,
  value: number,
  minimumFractionDigits: number = 2
) {
  return Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
  }).format(value);
}
