'use client';
import { createContext, type ReactNode, useEffect, useState } from 'react';

import {
  DEFAULT_LOCALE,
  fetchMessages,
  getLocaleFromPathname,
  getT
} from '@/utils/i18n/common';
import type { LocalizedMessages, TFunction } from '@/types';
import { Locale } from '@microrealestate/types';
import { usePathname } from 'next/navigation';

export const LocaleContext = createContext<{
  locale: Locale;
  t: TFunction;
}>({
  locale: DEFAULT_LOCALE,
  t: (key) => key
});

export default function LocaleProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<LocalizedMessages | null>(null);
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) || DEFAULT_LOCALE;

  useEffect(() => {
    async function fetch() {
      try {
        setMessages(await fetchMessages(locale));
      } catch (e) {
        console.error(e);
      }
    }
    if (!messages) {
      fetch();
    }
  }, [locale, messages]);

  return messages ? (
    <LocaleContext.Provider value={{ locale, t: getT(locale, messages) }}>
      {children}
    </LocaleContext.Provider>
  ) : null;
}
