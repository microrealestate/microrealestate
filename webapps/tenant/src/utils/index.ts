// TODO: remove momentjs and use date-fns
// TODO: import only the locale needed
import 'moment/locale/fr';
import 'moment/locale/pt';
import 'moment/locale/de';
import { type ClassValue, clsx } from 'clsx';
import { LeaseTimeRange, Locale } from '@microrealestate/types';
import moment from 'moment';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMoment(locale: Locale) {
  const lang = locale.split('-')[0];
  return (date: Date | string, pattern?: string) => {
    if (pattern) {
      return moment(date, pattern).locale(lang);
    }
    return moment(date).locale(lang);
  };
}

export function getFormatTimeRange(locale: Locale, timeRange: LeaseTimeRange) {
  const m = getMoment(locale);
  return (term: number) => {
    const momentTerm = m(String(term), 'YYYYMMDDHH');
    switch (timeRange) {
      case 'days':
        return momentTerm.format('LL');
      case 'weeks':
        return momentTerm.format('Wo');
      case 'months':
        return momentTerm.format('MMMM YYYY');
      case 'years':
        return momentTerm.format('YYYY');
      default:
        return String(term);
    }
  };
}
