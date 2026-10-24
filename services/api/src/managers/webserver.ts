import {
  Collections,
  logger,
  Service,
  ServiceError
} from '@microrealestate/common';
import type { ReverseProxy, WebServerConfig } from '@microrealestate/shared';
import {
  canDisableIpAccess,
  canEnableHttps,
  cleanDomain,
  parseDomain
} from '@microrealestate/shared';
import axios from 'axios';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// hostname labels + optional :port; also matches IPv4. Rejects whitespace,
// braces, slashes, newlines — anything that could inject Caddyfile directives.
const HOSTNAME_REGEX =
  /^(?=.{1,253}$)[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(:\d{1,5})?$/;

// output of validateWebServer: safe to persist and to render into a Caddyfile.
// `acmeEmail` stays optional — it is only required when https is on.
type NormalizedWebServer = WebServerConfig & { domain: string };

// Bound to 0.0.0.0 so the api container can reach the admin endpoint via
// `reverse-proxy:2019`. Without this, every reload would re-bind the admin
// to localhost-only and the next update would silently fail.
const CADDY_GLOBAL_OPTIONS = `{
  admin 0.0.0.0:2019
}

`;

// Byte-identical to the body of docker/Caddyfile.
const DEFAULT_CADDYFILE = `${CADDY_GLOBAL_OPTIONS}:80 {
  reverse_proxy gateway:8080
}
`;

// The proxy need not be listening yet when the api starts.
const SYNC_ATTEMPTS = 10;
const SYNC_RETRY_DELAY_MS = 2000;

/**
 * 'external' when the operator runs their own reverse proxy: no Caddy container
 * exists, so nothing is pushed to an admin API and TLS is not ours to manage.
 */
export function reverseProxy(): ReverseProxy {
  return Service.getInstance().envConfig.getValues().REVERSE_PROXY ===
    'external'
    ? 'external'
    : 'bundled';
}

export function externalWebServer(): NormalizedWebServer | null {
  return parseAppUrl(Service.getInstance().envConfig.getValues().APP_URL);
}

export function parseAppUrl(
  appUrl: string | undefined
): NormalizedWebServer | null {
  if (!appUrl) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(appUrl);
  } catch {
    return null;
  }
  if (
    (url.protocol !== 'https:' && url.protocol !== 'http:') ||
    !HOSTNAME_REGEX.test(url.host)
  ) {
    return null;
  }
  return {
    domain: url.host,
    acmeEmail: undefined,
    httpsEnabled: url.protocol === 'https:',
    ipAccessEnabled: true
  };
}

function _delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function _loadCaddyfile(caddyfile: string): Promise<void> {
  const { CADDY_ADMIN_URL } = Service.getInstance().envConfig.getValues();
  await axios.post(`${CADDY_ADMIN_URL}/load`, caddyfile, {
    headers: { 'Content-Type': 'text/caddyfile' }
  });
}

export function generateCaddyfile({
  domain: rawDomain,
  acmeEmail,
  httpsEnabled,
  ipAccessEnabled
}: NormalizedWebServer): string {
  // The stored domain keeps its port for the links in emails. Caddy only
  // listens on the published 80/443, so the site address must not carry it.
  const { host: domain, isLocal } = parseDomain(rawDomain);
  if (isLocal) {
    return DEFAULT_CADDYFILE;
  }

  const keepIpAccess = ipAccessEnabled !== false;

  if (!httpsEnabled) {
    // Explicit `http://` scheme prefix locks this site to port 80 and
    // disables Caddy's auto-HTTPS for it (no cert acquisition, no
    // HTTP→HTTPS redirect injection).
    const domainBlock = `http://${domain} {
  reverse_proxy gateway:8080
}
`;
    if (!keepIpAccess) {
      return `${CADDY_GLOBAL_OPTIONS}${domainBlock}`;
    }
    return `${CADDY_GLOBAL_OPTIONS}${domainBlock}
:80 {
  reverse_proxy gateway:8080
}
`;
  }

  const tlsDirective = acmeEmail ? `  tls ${acmeEmail}\n` : '';
  const domainBlock = `${domain} {
${tlsDirective}  reverse_proxy gateway:8080
}
`;

  if (!keepIpAccess) {
    return `${CADDY_GLOBAL_OPTIONS}${domainBlock}
:80 {
  redir https://${domain}{uri}
}
`;
  }

  return `${CADDY_GLOBAL_OPTIONS}${domainBlock}
:80 {
  @domain host ${domain}
  redir @domain https://${domain}{uri}
  reverse_proxy gateway:8080
}
`;
}

/**
 * Points the reverse proxy at the given configuration. Callers must invoke this
 * *before* persisting: a failed reload has to leave no stale DB state behind.
 */
export async function reloadCaddy(
  webServer: NormalizedWebServer
): Promise<void> {
  if (reverseProxy() === 'external') {
    return;
  }
  const caddyfile = generateCaddyfile(webServer);
  try {
    await _loadCaddyfile(caddyfile);
    logger.info(
      `Caddy reloaded with domain: ${webServer.domain} (https=${webServer.httpsEnabled ? 'on' : 'off'})`
    );
  } catch (error) {
    logger.error('Failed to reload Caddy config:', error);
    throw new ServiceError('failed to reload the reverse proxy', 502);
  }
}

async function _syncExternalWebServer(): Promise<void> {
  const webServer = externalWebServer();
  if (!webServer) {
    logger.error(
      'External reverse proxy: APP_URL is missing or invalid, set MRE_URL in .env'
    );
    return;
  }
  try {
    await Collections.Realm.updateOne({}, { $set: { webServer } });
    logger.info(
      `External reverse proxy - domain: ${webServer.domain} (https=${webServer.httpsEnabled ? 'on' : 'off'})`
    );
  } catch (error) {
    logger.error('Could not store the web server configuration:', error);
  }
}

/**
 * Re-applies the stored configuration to the reverse proxy on every api start.
 * Only the two mutating realm endpoints ever push to Caddy, so without this a
 * recreated container or a lost caddy_config volume would strand the proxy on
 * the bootstrap Caddyfile while the UI still shows the domain.
 *
 * Behind an external reverse proxy there is no Caddy to push to: the URL from
 * the environment is written to the organization instead, so the services
 * that build links from the stored domain follow a change of MRE_URL.
 *
 * Never rejects: the api has to serve even when the proxy does not answer.
 */
export async function syncWebServerFromDb(): Promise<void> {
  if (reverseProxy() === 'external') {
    await _syncExternalWebServer();
    return;
  }

  let caddyfile: string;
  let description: string;
  try {
    const realm = await Collections.Realm.findOne({}).sort({ _id: 1 }).lean();
    const stored = realm?.webServer ?? null;
    // Configurations saved before HTTPS was limited to public hostnames, or
    // stored behind an external proxy (HTTPS without an ACME email), still
    // have to load: serve them over plain HTTP
    const webServer = validateWebServer(
      stored?.httpsEnabled &&
        (!canEnableHttps(stored.domain ?? '') || !stored.acmeEmail)
        ? { ...stored, httpsEnabled: false }
        : stored
    );
    caddyfile = webServer ? generateCaddyfile(webServer) : DEFAULT_CADDYFILE;
    description = webServer
      ? `domain: ${webServer.domain} (https=${webServer.httpsEnabled ? 'on' : 'off'})`
      : 'no domain configured';
  } catch (error) {
    logger.error('Could not read the stored web server configuration:', error);
    return;
  }

  for (let attempt = 1; attempt <= SYNC_ATTEMPTS; attempt++) {
    try {
      await _loadCaddyfile(caddyfile);
      logger.info(`Reverse proxy configuration re-applied - ${description}`);
      return;
    } catch (error) {
      if (attempt === SYNC_ATTEMPTS) {
        logger.error(
          `Could not re-apply the reverse proxy configuration after ${SYNC_ATTEMPTS} attempts - ${description}:`,
          error
        );
        return;
      }
      await _delay(SYNC_RETRY_DELAY_MS);
    }
  }
}

/**
 * Validates and normalizes a submitted web server section. Returns `null` when
 * no domain was supplied — that is the documented "skip" and leaves the install
 * serving on the wildcard listener from the static docker/Caddyfile.
 */
export function validateWebServer(
  webServer: WebServerConfig | null
): NormalizedWebServer | null {
  if (
    !webServer ||
    typeof webServer.domain !== 'string' ||
    !webServer.domain.trim()
  ) {
    return null;
  }

  const domain = cleanDomain(webServer.domain);
  if (!HOSTNAME_REGEX.test(domain)) {
    throw new ServiceError('invalid domain', 422);
  }

  const httpsEnabled = webServer.httpsEnabled === true;

  const acmeEmail =
    typeof webServer.acmeEmail === 'string' && webServer.acmeEmail.trim()
      ? webServer.acmeEmail.trim()
      : undefined;

  if (httpsEnabled && !canEnableHttps(domain)) {
    throw new ServiceError(
      'HTTPS requires a public domain name without a port',
      422
    );
  }

  if (httpsEnabled && (!acmeEmail || !EMAIL_REGEX.test(acmeEmail))) {
    throw new ServiceError(
      'a valid email is required when HTTPS is enabled',
      422
    );
  }

  const ipAccessEnabled =
    webServer.ipAccessEnabled !== false || !canDisableIpAccess(domain);

  return {
    domain,
    acmeEmail: httpsEnabled ? acmeEmail : undefined,
    httpsEnabled,
    ipAccessEnabled
  };
}

export function keepIpAccess(
  webServer: NormalizedWebServer,
  previousWebServer: WebServerConfig | null | undefined
): NormalizedWebServer {
  if (
    webServer.ipAccessEnabled === false &&
    previousWebServer?.domain !== webServer.domain
  ) {
    return { ...webServer, ipAccessEnabled: true };
  }
  return webServer;
}

/**
 * True when two configurations would produce the same Caddyfile. Used to skip
 * reloading the live proxy on saves that did not touch this section.
 */
export function sameWebServer(
  a: WebServerConfig | null | undefined,
  b: WebServerConfig | null | undefined
): boolean {
  return (
    a?.domain === b?.domain &&
    a?.acmeEmail === b?.acmeEmail &&
    !!a?.httpsEnabled === !!b?.httpsEnabled &&
    (a?.ipAccessEnabled ?? true) === (b?.ipAccessEnabled ?? true)
  );
}
