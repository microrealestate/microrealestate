import '@/app/globals.css';
import config from '@/config';
import { Roboto } from 'next/font/google';
import type { Metadata } from 'next';
import Providers from '@/components/providers';
import type { ReactNode } from 'react';
import { cn } from '@/utils';
import { AppHeader } from '@/components/bars/app-header';
import { Toaster } from '@/components/ui/toaster';
import { Locale } from '@microrealestate/types';

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

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  display: 'swap',
  subsets: ['latin', 'latin-ext'],
});

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
      <body className={cn('min-h-screen', roboto.className)}>
        <Providers>
          <div className="flex flex-col items-center min-h-screen">
            <AppHeader />
            <div className="w-full my-5 max-w-sm sm:max-w-4xl">{children}</div>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
