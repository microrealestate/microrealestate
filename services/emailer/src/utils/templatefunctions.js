const moment = require('moment');

module.exports = ({ locale, currency }) => {
  moment.locale(locale);

  return {
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
    },
  };
};
