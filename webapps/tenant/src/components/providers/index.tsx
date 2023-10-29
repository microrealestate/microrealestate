'use client';
import ApplicationProvider from '@/components/providers/ApplicationProvider';
import LocaleProvider from '@/utils/i18n/client/LocaleProvider';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <ApplicationProvider>{children}</ApplicationProvider>
    </LocaleProvider>
  );
}
