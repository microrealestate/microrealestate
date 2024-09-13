import getServerEnv from '@/utils/env/server';
import getTranslation from '@/utils/i18n/server/getTranslation';
import Image from 'next/image';
import type { ReactNode } from 'react';

export default async function SignInLayout({
  children
}: {
  children: ReactNode;
}) {
  const BASE_PATH = getServerEnv('BASE_PATH') || '';
  const { t } = await getTranslation();

  return (
    <div className="mt-10 mx-4 sm:container sm:max-w-md">
      <div className="flex flex-col items-center mb-10">
        <Image
          src={`${BASE_PATH}/favicon.svg`}
          alt="Logo"
          width={40}
          height={40}
          className="mr-2"
        />
        <span className="text-2xl">{getServerEnv('APP_NAME') || ''}</span>
        <span className="text-secondary-foreground">{t('for tenants')}</span>
      </div>

      {children}
    </div>
  );
}
