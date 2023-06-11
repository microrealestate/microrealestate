import { env } from '@microrealestate/commonui/utils';

const config = {
  APP_NAME: env('APP_NAME'),
  BASE_PATH: env('BASE_PATH') || '',
  DEMO_MODE: env('DEMO_MODE') === 'true',
  NODE_ENV: env('NODE_ENV'),
};

export default config;
