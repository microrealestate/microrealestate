'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
import { DEFAULT_CURRENCY, formatNumber } from '../utils/formatNumber';

interface CurrencyContextValue {
  locale: string;
  currency: string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

interface CurrencyProviderProps {
  children: React.ReactNode;
  locale: string;
  currency: string;
}

export default function CurrencyProvider({
  children,
  locale,
  currency
}: CurrencyProviderProps) {
  const value = useMemo(
    () => ({
      locale: locale || 'en',
      currency: currency || DEFAULT_CURRENCY
    }),
    [locale, currency]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

let warned = false;
function resolveContext(
  ctx: CurrencyContextValue | null
): CurrencyContextValue {
  if (ctx) return ctx;
  if (process.env.NODE_ENV !== 'production' && !warned) {
    warned = true;
    console.warn(
      '[CurrencyProvider] useFormatNumber called outside <CurrencyProvider>. Falling back to en/USD.'
    );
  }
  return { locale: 'en', currency: DEFAULT_CURRENCY };
}

export function useFormatNumber() {
  const { locale, currency } = resolveContext(useContext(CurrencyContext));

  return useCallback(
    (
      value: number,
      style: 'currency' | 'percent' = 'currency',
      minimumFractionDigits?: number,
      showSign: boolean = false
    ): string => {
      if (style === 'percent') {
        return Number(value).toLocaleString(locale, {
          style: 'percent',
          minimumFractionDigits
        });
      }

      return formatNumber(
        locale,
        currency,
        value,
        minimumFractionDigits,
        showSign
      );
    },
    [locale, currency]
  );
}
