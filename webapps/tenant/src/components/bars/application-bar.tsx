import getServerEnv from '@/utils/env/server';
import { MainNav } from '@/components/bars/main-nav';
import ThemeToggle from '@/components/theme-toggle';
import UserMenu from './user-menu';

export default function ApplicationBar() {
  return (
    <nav className="container flex h-16 items-center justify-between p-0 pl-4">
      <MainNav appName={getServerEnv('APP_NAME') || ''} />
      <div className="flex items-center gap-1 pr-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </nav>
  );
}
