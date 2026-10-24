import dns from 'node:dns/promises';
import { Service, ServiceError } from '@microrealestate/common';
import ipaddr from 'ipaddr.js';

/**
 * What a landlord may point the mail configuration at.
 *
 * An internal relay is a supported setup — `smtp4dev` in development, `host.docker.internal`, a
 * Postfix on the LAN — so private and unique-local addresses stay allowed on purpose. These two
 * checks narrow what is left without taking that away.
 */

/** Ports a mail relay listens on. `SMTP_ALLOWED_PORTS` overrides it for an unusual relay. */
const DEFAULT_ALLOWED_PORTS = [25, 465, 587, 2525];

/**
 * Ranges no relay ever lives in, refused whatever else is configured:
 * - `loopback`: a relay is never inside this container
 * - `linkLocal`: holds 169.254.169.254, the cloud metadata endpoint
 * - `unspecified`: 0.0.0.0 and ::, which resolve to "this host" in most stacks
 */
const REFUSED_RANGES = ['loopback', 'linkLocal', 'unspecified'];

export function parseAllowedPorts(raw?: string): number[] {
  const ports = (raw ?? '')
    .split(',')
    .map((port) => Number(port.trim()))
    .filter((port) => Number.isInteger(port) && port > 0 && port <= 65535);
  return ports.length ? ports : DEFAULT_ALLOWED_PORTS;
}

/** True when the literal address sits in a range that is never a legitimate relay. */
export function isRefusedAddress(address: string): boolean {
  if (!ipaddr.isValid(address)) {
    return false;
  }
  let parsed = ipaddr.parse(address);
  if (parsed.kind() === 'ipv6') {
    const asIPv6 = parsed as ipaddr.IPv6;
    if (asIPv6.isIPv4MappedAddress()) {
      // ::ffff:127.0.0.1 must not pass as an ordinary IPv6 unicast address
      parsed = asIPv6.toIPv4Address();
    }
  }
  return REFUSED_RANGES.includes(parsed.range());
}

/**
 * Throws unless the configuration names a mail port and an address that could hold a relay. Called
 * for every transport, so it covers a real send as well as the connection test.
 */
export async function assertAllowedDestination(
  host: string,
  port: number
): Promise<void> {
  const { SMTP_ALLOWED_PORTS } = Service.getInstance().envConfig.getValues();

  if (!parseAllowedPorts(SMTP_ALLOWED_PORTS).includes(port)) {
    throw new ServiceError(`SMTP port ${port} is not allowed`, 422);
  }

  // Resolve first: the refused ranges are about where the name points, not about the name.
  const addresses = ipaddr.isValid(host)
    ? [host]
    : (await dns.lookup(host, { all: true })).map(({ address }) => address);

  if (addresses.some(isRefusedAddress)) {
    throw new ServiceError('SMTP host is not allowed', 422);
  }
}
