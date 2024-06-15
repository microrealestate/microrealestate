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

export function getT(locale: Locale, messages: LocalizedMessages): TFunction {
  function replaceData(message: string, data?: Record<string, string> | null) {
    if (data) {
      for (const [k, v] of Object.entries(data)) {
        message = message.replace(`{{${k}}}`, v);
      }
    }
    return message;
  }

  return (
    key: string,
    data?: Record<string, string> | null,
    plural?: {
      type?: Intl.PluralRuleType;
      count: number;
      offset?: number;
    }
  ) => {
    if (!messages) {
      throw new Error('Messages not loaded');
    }

    let message = messages[key];
    if (typeof message === 'string') {
      return replaceData(message, data);
    }

    if (typeof message === 'object' && plural) {
      const messageObj = message;
      const pluralKey = new Intl.PluralRules(locale, {
        type: plural.type
      }).select(plural.count);
      message = messageObj[pluralKey];
      return replaceData(message, data);
    }

    console.warn(`localized message not found for key: ${key}`);
    return `### ${key} ###`;
  };
}
