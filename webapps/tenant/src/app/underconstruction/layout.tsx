import '@/app/globals.css';
import config from '@/config';
import { Inter } from 'next/font/google';
import type { Locale } from '@/types';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cn } from '@/utils';

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
        <div className="flex flex-col items-center min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
