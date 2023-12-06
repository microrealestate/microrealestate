import { DEFAULT_LOCALE } from '@/utils/i18n/common';
import { Locale } from '@microrealestate/types';

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

export function getFormatNumber(locale: Locale, currency: string) {
  return ({
    value,
    minimumFractionDigits = 2,
    percent = false,
  }: {
    value: number;
    minimumFractionDigits?: number;
    percent?: boolean;
  }) => {
    return formatNumber(
      locale || DEFAULT_LOCALE,
      currency || DEFAULT_CURRENCY,
      value,
      minimumFractionDigits,
      percent
    );
  };
}
