'use client';

import '@microrealestate/commonui/config/yupConfig';
import CommonAppProvider from '@microrealestate/commonui/providers/AppProvider';
import CurrencyProvider from '@microrealestate/commonui/providers/CurrencyProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import { NextIntlClientProvider } from 'next-intl';
import NavProvider from './NavProvider';
import StoreProvider, { useStore } from './StoreProvider';

const queryClient = new QueryClient();

const StoreCurrencyProvider = observer(function StoreCurrencyProvider({
  children
}) {
  const store = useStore();
  const organization = store.organization.selected;
  return (
    <CurrencyProvider
      locale={organization?.locale}
      currency={organization?.currency}
    >
      {children}
    </CurrencyProvider>
  );
});

export default function AppProvider({ children, env, locale, messages }) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <QueryClientProvider client={queryClient}>
        <StoreProvider>
          <CommonAppProvider env={env}>
            <StoreCurrencyProvider>
              <NavProvider>{children}</NavProvider>
            </StoreCurrencyProvider>
          </CommonAppProvider>
        </StoreProvider>
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}
