import { set } from 'lodash';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

function flattenMessages(
  nestedMessages: Record<string, unknown>,
  acc: Record<string, unknown> = {},
  prefix = ''
) {
  for (const key in nestedMessages) {
    if (Object.hasOwn(nestedMessages, key)) {
      const value = nestedMessages[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null) {
        flattenMessages(value as Record<string, unknown>, acc, newKey);
      } else {
        set(acc, newKey, value);
      }
    }
  }
  return acc;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested && hasLocale(routing.locales, requested)
      ? requested
      : routing.defaultLocale;

  const messages = (await import(`../../locales/${locale}/common.json`))
    .default;
  const flattenedMessages = flattenMessages(messages);

  return {
    locale,
    messages: { common: flattenedMessages }
  };
});
