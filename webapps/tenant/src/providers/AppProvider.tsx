'use client';

import '@microrealestate/commonui/config/yupConfig';
import CommonAppProvider from '@microrealestate/commonui/providers/AppProvider';
import type { AbstractIntlMessages } from 'next-intl';
import { NextIntlClientProvider } from 'next-intl';

interface AppProviderProps {
  children: React.ReactNode;
  env: Record<string, string | undefined>;
  locale: string;
  messages: AbstractIntlMessages;
}

export default function AppProvider({
  children,
  env,
  locale,
  messages
}: AppProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <CommonAppProvider env={env}>{children}</CommonAppProvider>
    </NextIntlClientProvider>
  );
}
