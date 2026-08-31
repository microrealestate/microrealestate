import { SessionProvider } from '@microrealestate/commonui/providers/SessionProvider';
import { headers } from 'next/headers';
import LandlordShell from '@/components/shell/LandlordShell';

export default async function Layout({ children }) {
  const headerStore = await headers();
  const session = JSON.parse(headerStore.get('x-session') || 'null');

  return (
    <SessionProvider session={session}>
      <LandlordShell>{children}</LandlordShell>
    </SessionProvider>
  );
}
