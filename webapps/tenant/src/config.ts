const config = {
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || '',
  BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || '',
  CORS_ENABLED: process.env.NEXT_PUBLIC_CORS_ENABLED === 'true',
  DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
  DOCKER_GATEWAY_URL: process.env.DOCKER_GATEWAY_URL,
  GATEWAY_URL: process.env.NEXT_PUBLIC_GATEWAY_URL,
  DOMAIN_URL: process.env.DOMAIN_URL || 'http://localhost',
  NODE_ENV: process.env.NODE_ENV || '',
} as const;

export default config;
