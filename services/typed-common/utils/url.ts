export function destructUrl(baseUrl: string) {
  const url = new URL(baseUrl);
  let subDomain;
  let domain = url.hostname;

  if (!/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/.test(url.hostname)) {
    // avoid the split if hostname is an IP address
    const canonicalHostname = url.hostname.split('.');
    if (canonicalHostname.length >= 3) {
      subDomain = canonicalHostname.slice(0, -2).join('.');
      domain = `${canonicalHostname.at(-2)}.${canonicalHostname.at(-1)}`;
    }
  }

  let basePath;
  if (url.pathname !== '/') {
    basePath = url.pathname;
  }

  return {
    protocol: url.protocol,
    subDomain,
    domain,
    port: url.port,
    basePath,
  };
}

export function buildUrl({
  protocol,
  subDomain,
  domain,
  port,
  basePath,
}: {
  protocol: string;
  subDomain?: string;
  domain: string;
  port?: string;
  basePath?: string;
}) {
  let url = `${protocol}//`;
  if (subDomain) {
    url += `${subDomain}.`;
  }
  url += `${domain}`;
  if (port) {
    url += `:${port}`;
  }
  if (basePath) {
    url += basePath;
  }
  return url;
}
