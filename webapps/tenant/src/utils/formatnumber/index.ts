import { routing } from '@/i18n/routing';

const DEFAULT_LOCALE = routing.defaultLocale;

export const DEFAULT_CURRENCY = 'USD' as const;

export function formatNumber({
  locale = DEFAULT_LOCALE,
  currency = DEFAULT_CURRENCY,
  value,
  minimumFractionDigits = 2,
  percent = false
}: {
  locale?: string;
  currency?: string;
  value: number;
  minimumFractionDigits?: number;
  percent?: boolean;
}) {
  return Intl.NumberFormat(
    locale,
    percent
      ? { style: 'percent', minimumFractionDigits }
      : { style: 'currency', currency, minimumFractionDigits }
  ).format(value);
}

export function getFormatNumber(locale: string, currency: string) {
  return (options: {
    value: number;
    minimumFractionDigits?: number;
    percent?: boolean;
  }) => {
    return formatNumber({
      locale: locale || DEFAULT_LOCALE,
      currency: currency || DEFAULT_CURRENCY,
      ...options
    });
  };
}
