import {
  DEFAULT_LOCALE,
  fetchMessages,
  getLocaleFromPathname,
  getT
} from '@/utils/i18n/common';
import { headers } from 'next/headers';

export default async function getTranslation() {
  const pathname = headers().get('x-path') || '';
  const locale = getLocaleFromPathname(pathname) || DEFAULT_LOCALE;
  const messages = await fetchMessages(locale);
  return {
    locale,
    t: getT(locale, messages)
  };
}
