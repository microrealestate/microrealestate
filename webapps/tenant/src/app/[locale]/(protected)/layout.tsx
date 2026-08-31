import '@/app/globals.css';
import { SessionProvider } from '@microrealestate/commonui/providers/SessionProvider';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import { TenantShell } from '@/components/tenant-shell';
import { QueryProvider } from '@/providers/QueryProvider';

export default async function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  const headerStore = await headers();
  const sessionString = headerStore.get('x-session');
  const session = sessionString ? JSON.parse(sessionString) : null;

  return (
    <SessionProvider session={session}>
      <QueryProvider>
        <TenantShell>{children}</TenantShell>
      </QueryProvider>
    </SessionProvider>
  );
}
