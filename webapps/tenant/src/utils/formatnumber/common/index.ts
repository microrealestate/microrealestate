import { DEFAULT_LOCALE } from '@/utils/i18n/common';
import type { Locale } from '@/types';

export const DEFAULT_CURRENCY: Readonly<string> = 'USD';

export function formatNumber(
  locale: Locale = DEFAULT_LOCALE,
  currency: string = DEFAULT_CURRENCY,
  value: number,
  minimumFractionDigits: number = 2,
  percent: boolean = false
) {
  if (percent) {
    return Number(value).toLocaleString(locale, {
      style: 'percent',
      minimumFractionDigits,
    });
  } else {
    return Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits,
    }).format(value);
  }
}
