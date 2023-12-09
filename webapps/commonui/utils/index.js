export function isServer() {
  return typeof window === 'undefined';
}

export function isClient() {
  return !isServer();
}

export function env(key) {
  if (isClient()) {
    if (!window.__ENV) {
      // fallback in case public/__ENV.js is not generated
      window.__ENV = {
        NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
        NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || '',
        NEXT_PUBLIC_CORS_ENABLED: process.env.NEXT_PUBLIC_CORS_ENABLED,
        NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
        NEXT_PUBLIC_DOCKER_GATEWAY_URL:
          process.env.NEXT_PUBLIC_DOCKER_GATEWAY_URL,
        NEXT_PUBLIC_GATEWAY_URL: process.env.NEXT_PUBLIC_GATEWAY_URL,
        NEXT_PUBLIC_SIGNUP: process.env.NEXT_PUBLIC_SIGNUP,
      };
    }
    return (
      window.__ENV[`NEXT_PUBLIC_${key}`] ||
      // Do not get from process.env when the base path can be set at runtime
      process.env[`NEXT_PUBLIC_${key}`]
    );
  }
  return process.env[`NEXT_PUBLIC_${key}`] || process.env[key];
}
