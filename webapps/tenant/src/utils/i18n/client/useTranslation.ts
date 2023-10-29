'use client';

import { LocaleContext } from '@/utils/i18n/client/LocaleProvider';
import { useContext } from 'react';

export default function useTranslation() {
  const { locale, t } = useContext(LocaleContext);

  return {
    locale,
    t,
  };
}
