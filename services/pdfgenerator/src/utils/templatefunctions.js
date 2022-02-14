const path = require('path');
const moment = require('moment');
const i18n = require('i18n');

i18n.configure({
  locales: ['en', 'fr-FR', 'pt-BR', 'de-DE'],
  directory: path.join(__dirname, '..', '..', 'templates', 'locales'),
  updateFiles: false,
});

module.exports = ({ locale, currency }) => {
  moment.locale(locale);
  i18n.setLocale(locale);

  return {
    t: (...params) => {
      return i18n.__(...params);
    },
    formatNumber: (value, style = 'decimal', minimumFractionDigits = 2) => {
      if (['currency', 'decimal'].includes(style)) {
        return Intl.NumberFormat(locale, {
          style,
          currency,
          minimumFractionDigits,
        }).format(value);
      }

      if (style === 'percent') {
        return Number(value).toLocaleString(locale, {
          style: 'percent',
          minimumFractionDigits,
        });
      }

      return value;
    },
    formatDate: (dateTxt, localizedFormat) => {
      return moment(dateTxt, 'DD/MM/YYYY').format(localizedFormat);
    },
    formatTerm: (termTxt, timeRange) => {
      const term = moment(termTxt, 'YYYYMMDDHH');
      if (timeRange === 'days') {
        return term.format('LL');
      }

      if (timeRange === 'weeks') {
        return i18n.__('{{month}} {{startDay}} to {{endDay}}', {
          month: term.format('MMM'),
          startDay: term.startOf('week').format('Do'),
          endDay: term.endOf('week').format('Do'),
        });
      }

      if (timeRange === 'months') {
        return term.format('MMMM YYYY');
      }

      if (timeRange === 'years') {
        return term.format('YYYY');
      }
      return termTxt;
    },
  };
};
