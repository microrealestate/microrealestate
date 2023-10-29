import '@/app/globals.css';
import config from '@/config';
import { Inter } from 'next/font/google';
import type { Locale } from '@/types';
import type { Metadata } from 'next';
import Providers from '@/components/providers';
import type { ReactNode } from 'react';
import { cn } from '@/utils';
import { AppHeader } from '@/components/bars/app-header';

const APP_TITLE = [config.APP_NAME, 'Tenant'];
if (config.NODE_ENV === 'development') {
  APP_TITLE.push('DEV');
} else if (config.DEMO_MODE) {
  APP_TITLE.push('DEMO');
}

export const metadata: Metadata = {
  title: APP_TITLE.join(' - '),
  description: 'A platform for landlords to manage their properties.',
  keywords:
    'real estate, landlord, property, rental, property management platform, property management software, property management system',
};

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default async function RootLayout({
  params: { lang },
  children,
}: {
  params: { lang: Locale };
  children: ReactNode;
}) {
  return (
    <html lang={lang} translate="no">
      <head>
        <link rel="icon" href={`${config.BASE_PATH}/favicon.svg`} />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable
        )}
      >
        <Providers>
          <div className="flex flex-col items-center min-h-screen bg-slate-100">
            <AppHeader />
            <div className="w-full max-w-3xl my-5">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
