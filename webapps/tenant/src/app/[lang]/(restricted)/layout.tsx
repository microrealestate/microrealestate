import '@/app/globals.css';
import { AppHeader } from '@/components/bars/app-header';
import type { ReactNode } from 'react';

export default async function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center min-h-screen">
      <AppHeader />
      <div className="w-full my-5 max-w-sm sm:max-w-4xl">{children}</div>
    </div>
  );
}
