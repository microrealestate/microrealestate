const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const FORMATTED_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/**
 * Axios transformResponse that converts ISO 8601 date strings to Date objects.
 * Use as: `axios.defaults.transformResponse = [transformResponseDates]`
 * or in `axios.create({ transformResponse: [transformResponseDates] })`
 */
export function transformResponseDates(data: unknown): unknown {
  if (typeof data !== 'string') {
    return data;
  }
  try {
    return JSON.parse(data, (_key, value) => {
      if (
        typeof value === 'string' &&
        (ISO_DATE_RE.test(value) || FORMATTED_DATE_RE.test(value))
      ) {
        return new Date(value);
      }
      return value;
    });
  } catch {
    return data;
  }
}

function isDateLike(value: unknown): value is Date | { toDate(): Date } {
  if (value instanceof Date) return true;
  if (value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate(): Date }).toDate() instanceof Date;
  }
  return false;
}

function formatDateLike(value: Date | { toDate(): Date }): string {
  const date = value instanceof Date ? value : value.toDate();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}

/**
 * Recursively walks an object and converts Date (and moment-like) values
 * to `YYYY-MM-DDTHH:mm` strings before they hit the wire.
 * Useful as an Axios request interceptor: attach to `config.data`.
 */
export function transformRequestDates(data: unknown): unknown {
  if (isDateLike(data)) {
    return formatDateLike(data);
  }
  if (Array.isArray(data)) {
    return data.map(transformRequestDates);
  }
  if (typeof data === 'object' && data !== null) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      result[k] = transformRequestDates(v);
    }
    return result;
  }
  return data;
}
