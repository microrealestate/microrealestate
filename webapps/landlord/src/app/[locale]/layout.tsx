import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import type { PropsWithChildren } from 'react';
import { routing } from '@/i18n/routing';
import '../../styles/globals.css';
import 'react-awesome-lightbox/build/style.css';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import '../../components/DocumentViewer/ImageViewer/imageviewer.css';
import '../../components/RichTextEditor/richtexteditor.css';
import AppHeadTags from '@microrealestate/commonui/components/AppHeadTags';
import type { Metadata } from 'next';
import AppProvider from '@/providers/AppProvider';
import { BASE_PATH } from '@/utils/basepath';

const inter = Inter({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-app'
});

const APP_TITLE = ['MicroRealEstate', 'Landlord'];
if (process.env.NODE_ENV === 'development') {
  APP_TITLE.push('DEV');
} else if (process.env.DEMO_MODE === 'true') {
  APP_TITLE.push('DEMO');
}

export const metadata: Metadata = {
  title: APP_TITLE.join(' - ')
};

interface LocaleLayoutProps extends PropsWithChildren {
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  const env = {
    NEXT_PUBLIC_DEMO_MODE: process.env.DEMO_MODE,
    NEXT_PUBLIC_BASE_PATH: BASE_PATH
  };

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        <AppHeadTags
          basePath={BASE_PATH}
          appName="MicroRealEstate"
          locale={locale}
        />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </head>
      <body className={inter.className}>
        <AppProvider env={env} locale={locale} messages={messages}>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
