const config = {
  // env variables evaluated at build time and accessible in the browser
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || '',
  // NEXT_PUBLIC_CORS_ENABLED: process.env.NEXT_PUBLIC_CORS_ENABLED === 'true',
  NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
  // NEXT_PUBLIC_GATEWAY_URL: process.env.NEXT_PUBLIC_GATEWAY_URL,
  // NEXT_PUBLIC_SIGNUP: process.env.NEXT_PUBLIC_SIGNUP === 'true',

  //env variables evaluated at build time and accessible in the server
  APP_URL: process.env.APP_URL,
  // CORS_ENABLED: process.env.CORS_ENABLED === 'true',
  // DOCKER_GATEWAY_URL: process.env.DOCKER_GATEWAY_URL,
  // GATEWAY_URL: process.env.GATEWAY_URL,
  NODE_ENV: process.env.NODE_ENV,
  // SIGNUP: process.env.SIGNUP === 'true',
};

export default config;
