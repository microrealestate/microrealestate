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
