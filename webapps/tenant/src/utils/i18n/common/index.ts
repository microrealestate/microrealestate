import type { LocaleMap, LocalizedMessages, TFunction } from '@/types';
import { Locale } from '@microrealestate/types';

export const LOCALES = ['de-DE', 'en', 'fr', 'pt-BR'] as const;
export const DEFAULT_LOCALE = 'en' as const;
const MESSAGES_CACHE = new Map() as LocaleMap;

export function getLocaleFromPathname(pathname: string) {
  for (let i = 0; i < LOCALES.length; i++) {
    const locale = LOCALES[i];
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return pathname.split('/')[1] as Locale;
    }
  }
  return null;
}

export async function fetchMessages(
  locale: Locale
): Promise<LocalizedMessages> {
  let messages = MESSAGES_CACHE.get(locale);

  if (!messages) {
    try {
      messages = (await import(
        `../../../../locales/${locale}.json`
      )) as LocalizedMessages;
      MESSAGES_CACHE.set(locale, messages);
    } catch (e) {
      console.error(e);
    }
  }

  return messages || {};
}

export function getT(messages: LocalizedMessages): TFunction {
  return (key: string, data?: Record<string, string>) => {
    if (messages === undefined) {
      return '';
    }
    let message = messages?.[key] || key;
    if (data) {
      for (const [k, v] of Object.entries(data)) {
        message = message.replace(`{{${k}}}`, v);
      }
    }
    return message;
  };
}
