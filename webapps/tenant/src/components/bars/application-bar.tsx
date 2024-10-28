import getServerEnv from '@/utils/env/server';
import { MainNav } from '@/components/bars/main-nav';
import UserMenu from './user-menu';

export default function ApplicationBar() {
  return (
    <nav className="container flex h-16 items-center justify-between p-0 pl-4">
      <MainNav appName={getServerEnv('APP_NAME') || ''} />
      <UserMenu />
    </nav>
  );
}
