import getServerEnv from '@/utils/env/server';
import getServerSession from '@/utils/session/server/getsession';
import { MainNav } from '@/components/bars/main-nav';
import UserMenu from './user-menu';

export default async function ApplicationBar() {
  const session = await getServerSession();
  if (!session) {
    return null;
  }

  return (
    <nav className="container flex h-16 items-center justify-between p-0 pl-4">
      <MainNav appName={getServerEnv('APP_NAME') || ''} />
      <UserMenu />
    </nav>
  );
}
