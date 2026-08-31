import moment from 'moment';

export const DATE_FORMAT = 'YYYY-MM-DDTHH:mm';
export const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function isFormattedDate(value: unknown): value is string {
  return typeof value === 'string' && DATE_FORMAT_REGEX.test(value);
}

export function formatDate(
  value: Date | string | number | moment.Moment | null | undefined
): string | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  if (typeof value === 'string' && isFormattedDate(value)) {
    return value;
  }
  const m = moment.isMoment(value) ? value : moment(value);
  return m.isValid() ? m.format(DATE_FORMAT) : undefined;
}

export function now(): string {
  return moment().format(DATE_FORMAT);
}
