const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const FORMATTED_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export const SPONSOR_URL = 'https://ko-fi.com/camelaissani/tip';
export const COMMERCIAL_CONTACT_URL =
  'mailto:camel.aissani@gmail.com?subject=MicroRealEstate%20commercial%20use';

export const PASSWORD_MIN_LENGTH = 8;
/** at least one lowercase, one uppercase and one digit */
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function isStrongPassword(password: unknown): boolean {
  return typeof password === 'string' && PASSWORD_PATTERN.test(password);
}

/**
 * Strips the protocol prefix and any path from a user-typed domain, leaving
 * `hostname[:port]`. The api validates the result again server-side; the
 * client uses it so what is submitted matches what is displayed.
 */
export function cleanDomain(raw: string): string {
  return raw
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .trim();
}

const DOMAIN_OR_IP_REGEX =
  /^(\d{1,3}(\.\d{1,3}){3}|localhost|([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,})(:\d{1,5})?$/i;

export function isValidDomain(domain: string): boolean {
  const cleaned = cleanDomain(domain || '');
  if (!DOMAIN_OR_IP_REGEX.test(cleaned)) {
    return false;
  }
  const port = cleaned.match(/:(\d+)$/)?.[1];
  return port === undefined || (Number(port) >= 1 && Number(port) <= 65535);
}

export type ParsedDomain = {
  host: string;
  port?: string;
  valid: boolean;
  isIP: boolean;
  // an IP address or localhost: no public certificate, reached without a name
  isLocal: boolean;
};

/**
 * Shared by the landlord form and the api so both apply the same web server
 * rules.
 */
export function parseDomain(domain: string): ParsedDomain {
  const match = cleanDomain(domain || '').match(/^(.*?)(?::(\d+))?$/);
  const host = (match?.[1] || '').toLowerCase();
  const port = match?.[2];
  const isIP = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  const isLocal = isIP || host === 'localhost';
  return { host, port, valid: isValidDomain(domain), isIP, isLocal };
}

/**
 * HTTPS needs a certificate from ACME, which is only issued for a public
 * hostname served on the standard ports.
 */
export function canEnableHttps(domain: string): boolean {
  const { port, valid, isLocal } = parseDomain(domain);
  return valid && !isLocal && !port;
}

export function canDisableIpAccess(domain: string): boolean {
  const { valid, isLocal } = parseDomain(domain);
  return valid && !isLocal;
}

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
