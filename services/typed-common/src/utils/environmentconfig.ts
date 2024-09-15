import _ from 'lodash';
import { EnvironmentValues } from '@microrealestate/types';
import logger from 'winston';

const baseEnvironmentValues = {
  LOGGER_LEVEL: process.env.LOGGER_LEVEL || 'debug',
  PRODUCTION: process.env.NODE_ENV === 'production',
  PORT: Number(process.env.PORT || 8080),
  MONGO_URL:
    process.env.MONGO_URL ||
    process.env.BASE_DB_URL ||
    'mongodb://localhost/demodb',
  REDIS_URL:
    process.env.REDIS_URL ||
    process.env.TOKEN_DB_URL ||
    'redis://localhost:6379',
  REDIS_PASSWORD:
    process.env.REDIS_PASSWORD || process.env.TOKEN_DB_PASSWORD || undefined,

  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  APPCREDZ_TOKEN_SECRET: process.env.APPCREDZ_TOKEN_SECRET,
  RESET_TOKEN_SECRET: process.env.RESET_TOKEN_SECRET,
  CIPHER_KEY: process.env.CIPHER_KEY,
  CIPHER_IV_KEY: process.env.CIPHER_IV_KEY,
} as const;
const valuesToEscape: string[] = [
  'password',
  'token',
  'secret',
  'cipher',
  'apiKey',
];

export default class EnvironmentConfig {
  private envValues: Readonly<EnvironmentValues>;

  constructor(envValues?: EnvironmentValues) {
    if (envValues) {
      this.envValues = { ...baseEnvironmentValues, ...envValues };
    } else {
      this.envValues = baseEnvironmentValues;
    }
  }

  getValues() {
    return this.envValues;
  }

  log() {
    const obfuscatedConfig = _.cloneDeep<EnvironmentValues>(this.envValues);
    logger.debug('Environment variables set:');
    Object.entries(obfuscatedConfig)
      .sort(([key1], [key2]) => key1.localeCompare(key2))
      .filter(([, value]) => {
        return value !== undefined && value !== null;
      })
      .reduce((acc, [key, value]) => {
        let valueString = JSON.stringify(value);
        if (
          valuesToEscape.some(
            (valueToEscape) =>
              key.toLowerCase().indexOf(valueToEscape.toLowerCase()) !== -1
          )
        ) {
          valueString = '****';
        }
        acc.push(`${key}: ${valueString}`);
        return acc;
      }, [] as string[])
      .forEach((configLine) => logger.debug(configLine));
  }
}
