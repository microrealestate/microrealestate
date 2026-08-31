const AUTH_PAGE_REGEX =
  /(^|\/)(signin|signup|forgotpassword|resetpassword)(\/[^/]+)?$/;

export function sanitizeRedirect(value) {
  if (!value || typeof value !== 'string') return null;
  if (!value.startsWith('/')) return null;
  if (value.startsWith('//') || value.startsWith('/\\')) return null;
  if (/[\r\n\t]/.test(value)) return null;
  const pathOnly = value.split('?')[0].split('#')[0];
  if (AUTH_PAGE_REGEX.test(pathOnly)) return null;
  return value;
}
