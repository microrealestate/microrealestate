import moment from 'moment';

export function getPeriod(t, term, frequency) {
  const termMoment = moment(term, 'YYYYMMDDHH');
  switch (frequency) {
    case 'years':
      return termMoment.format('YYYY');
    case 'months':
      return t('{month} {year}', {
        month: termMoment.format('MMMM'),
        year: termMoment.format('YYYY')
      });
    case 'weeks':
      return t('{month} {startDay} to {endDay}', {
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
