import '@/app/globals.css';
import { cn } from '@microrealestate/commonui/utils';
import type { Metadata } from 'next';
import { unstable_noStore as noStore } from 'next/cache';
import { Inter } from 'next/font/google';

import { getMessages } from 'next-intl/server';
import type { ReactNode } from 'react';
import AppProvider from '@/providers/AppProvider';
import { BASE_PATH } from '@/utils/basepath';

const APP_TITLE = ['MicroRealEstate', 'Tenant'];
if (process.env.NODE_ENV === 'development') {
  APP_TITLE.push('DEV');
} else if (process.env.DEMO_MODE === 'true') {
  APP_TITLE.push('DEMO');
}

export const metadata: Metadata = {
  title: APP_TITLE.join(' - '),
  description: 'A platform for landlords to manage their properties.',
  keywords:
    'real estate, landlord, property, rental, property management platform, property management software, property management system'
};

const inter = Inter({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-app'
});

export default async function RootLayout(props: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  const params = await props.params;

  const { locale } = params;

  const { children } = props;

  noStore(); // Opt into dynamic rendering

  const messages = await getMessages();

  const env = {
    NEXT_PUBLIC_DEMO_MODE: process.env.DEMO_MODE,
    NEXT_PUBLIC_APP_VERSION: process.env.MRE_VERSION
  };

  return (
    <html lang={locale} translate="no" className="overscroll-none">
      <head>
        <link rel="icon" href={`${BASE_PATH}/favicon.svg`} />
      </head>
      <body className={cn('min-h-screen', inter.variable)}>
        <AppProvider env={env} locale={locale} messages={messages}>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
