// import {
//   authOptions,
//   getServerSession,
// } from '@/mocks/session/server/getServerSession';
import config from '@/config';
import { headers } from 'next/headers';
import { LogoutNav } from '@/components/bars/logout-nav';
import { MainNav } from '@/components/bars/main-nav';

function isSigninPage() {
  console.log(headers().get('x-path'));
  const pathname = headers().get('x-path');
  if (pathname) {
    return pathname.endsWith('/signin');
  }
  return false;
}

export default async function ApplicationBar() {
  // const session = await getServerSession(authOptions);
  const session = !isSigninPage();
  return session ? (
    <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
      <MainNav appName={config.APP_NAME} />
      <LogoutNav />
    </div>
  ) : null;
}
