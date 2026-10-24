import { DateFormat } from '@microrealestate/common';
import Handlebars from 'handlebars';
import i18n from 'i18n';
import moment from 'moment';

interface HelperOptions {
  hash?: Record<string, unknown>;
}

// Handlebars appends an options object to every helper call, so the declared parameters are
// read off the front and the options object off the back.
function _split(params: unknown[]): [unknown[], HelperOptions | undefined] {
  return [
    params.slice(0, -1),
    params[params.length - 1] as HelperOptions | undefined
  ];
}

export default function ({
  locale,
  currency
}: {
  locale: string;
  currency: string;
}) {
  moment.locale(locale);
  i18n.setLocale(locale);

  return {
    // The message catalogs carry markup (`<strong>{{term}}</strong>`) and i18n runs its own
    // mustache pass over the named parameters, escaping `{{name}}` and leaving `{{{name}}}` raw.
    // Returning a SafeString hands that result through untouched instead of escaping it twice.
    t: (...params: unknown[]) => {
      const [args, options] = _split(params);
      const [message] = args as [string];
      const namedParams = options?.hash as Record<string, string> | undefined;
      return new Handlebars.SafeString(
        namedParams && Object.keys(namedParams).length
          ? i18n.__(message, namedParams)
          : i18n.__(message)
      );
    },
    formatNumber: (...params: unknown[]) => {
      const [args] = _split(params);
      const [value, style = 'decimal', minimumFractionDigits = 2] = args as [
        number,
        string?,
        number?
      ];

      if (['currency', 'decimal'].includes(style)) {
        return Intl.NumberFormat(locale, {
          style: style as 'currency' | 'decimal',
          currency,
          minimumFractionDigits
        }).format(value);
      }

      if (style === 'percent') {
        return Number(value).toLocaleString(locale, {
          style: 'percent',
          minimumFractionDigits
        });
      }

      return value;
    },
    formatDate: (...params: unknown[]) => {
      const [args] = _split(params);
      const [dateTxt, localizedFormat] = args as [string, string];
      return moment(dateTxt, DateFormat.DATE_FORMAT).format(localizedFormat);
    },
    formatTerm: (...params: unknown[]) => {
      const [args] = _split(params);
      const [termTxt, timeRange] = args as [string, string];
      const term = moment(termTxt, 'YYYYMMDDHH');
      if (timeRange === 'days') {
        return term.format('LL');
      }

      if (timeRange === 'weeks') {
        // TODO: should be formatted with i18n
        return `${term.format('MMM')} ${term
          .startOf('week')
          .format('Do')} - ${term.endOf('week').format('Do')}`;
      }

      if (timeRange === 'months') {
        return term.format('MMMM YYYY');
      }

      if (timeRange === 'years') {
        return term.format('YYYY');
      }
      return termTxt;
    }
  };
}
