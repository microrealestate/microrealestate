export function isServer() {
  return typeof window === 'undefined';
}

export function isClient() {
  return !isServer();
}

export function env(key) {
  if (isClient()) {
    return window.__ENV[`NEXT_PUBLIC_${key}`];
  }
  return process.env[key];
}
