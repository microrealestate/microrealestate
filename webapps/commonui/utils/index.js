export function isServer() {
  return typeof window === 'undefined';
}

export function isClient() {
  return !isServer();
}

export function env(key) {
  if (isClient()) {
    return (
      window.__ENV[`NEXT_PUBLIC_${key}`] ||
      // Do not get from process.env when the base path can be set at runtime
      process.env[`NEXT_PUBLIC_${key}`]
    );
  }
  return process.env[`NEXT_PUBLIC_${key}`] || process.env[key];
}
