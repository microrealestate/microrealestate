import { EnvironmentBar } from '@/components/bars/environment-bar';
import getServerEnv from '@/utils/env/server';
import getTranslation from '@/utils/i18n/server/getTranslation';
import type { ReactNode } from 'react';
import { WelcomeIllustration } from '@/components/illustrations';

export default async function SignInLayout({
  children
}: {
  children: ReactNode;
}) {
  const { t } = await getTranslation();

  return (
    <>
      <EnvironmentBar className="bg-card shadow sticky top-0 z-40 w-full" />
      <div className="flex h-screen">
        <div className="hidden lg:flex flex-col items-center justify-center space-y-20 text-center font-medium bg-sky-900 text-white/95 w-[36rem]">
          <div className="space-y-2">
            <div className="text-5xl">{getServerEnv('APP_NAME')}</div>
            <div>{t('for tenants')}</div>
          </div>
          <WelcomeIllustration />
        </div>
        <div className="flex flex-col items-center justify-center w-full relative">
          <div className="lg:hidden text-4xl mb-5">
            {getServerEnv('APP_NAME')}
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
