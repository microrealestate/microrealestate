import { clsx } from 'clsx';
import moment from 'moment';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getPeriod(t, term, frequency) {
  const termMoment = moment(term, 'YYYYMMDDHH');
  switch (frequency) {
    case 'years':
      return termMoment.format('YYYY');
    case 'months':
      return t('{{month}} {{year}}', {
        month: termMoment.format('MMMM'),
        year: termMoment.format('YYYY')
      });
    case 'weeks':
      return t('{{month}} {{startDay}} to {{endDay}}', {
        month: termMoment.format('MMM'),
        startDay: termMoment.startOf('week').format('Do'),
        endDay: termMoment.endOf('week').format('Do')
      });
    case 'days':
      return termMoment.format('L');
    default:
      return '';
  }
}

export function buildPathname(router) {
  let basePath = router.basePath || '';
  if (router.locale) {
    basePath = `${basePath}/${router.locale}`;
  }

  const segments = router.pathname.match(/\[[^\]]+\]/g);
  let newPathname = router.pathname;
  if (segments) {
    segments.forEach((segment) => {
      const key = segment.slice(1, -1);
      newPathname = newPathname.replace(segment, router.query[key] || '');
    });
  }

  return `${basePath}${newPathname}`;
}
