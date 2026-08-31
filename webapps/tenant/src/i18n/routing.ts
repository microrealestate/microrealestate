import { LOCALES } from '@microrealestate/shared';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: [...LOCALES],
  defaultLocale: 'en'
});
