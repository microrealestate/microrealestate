import React, { useContext, useState } from 'react';
import config from '../config';
import { SignInUpIllustration } from '../components/Illustrations';
import useTranslation from 'next-translate/useTranslation';

export default function SignInUpLayout({ children }) {
  const { t } = useTranslation('common');

  return (
    <div className="flex h-screen">
      <div className="hidden lg:flex flex-col items-center justify-center space-y-20 text-center font-medium bg-sky-900 text-white/95 w-[36rem]">
        <div className="space-y-2">
          <div className="text-5xl">{config.APP_NAME}</div>
          <div>{t('for landlords')}</div>
        </div>
        <SignInUpIllustration />
      </div>
      <div className="flex flex-col items-center justify-center w-full relative">
        <div className="lg:hidden text-4xl mb-5">{config.APP_NAME}</div>
        {children}
      </div>
    </div>
  );
}
