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
  CIPHER_IV_KEY: process.env.CIPHER_IV_KEY
} as const;

const valuesToEscape: string[] = [
  'password',
  'token',
  'secret',
  'cipher',
  'apiKey'
];

const urlsToEscape: string[] = ['url', 'uri', 'endpoint'];

function obfuscateValue<T>(key: string, value: T): T {
  if (value instanceof String) {
    if (
      valuesToEscape.some(
        (valueToEscape) =>
          key.toLowerCase().indexOf(valueToEscape.toLowerCase()) !== -1
      )
    ) {
      return '****' as T;
    }

    if (
      urlsToEscape.some((candidateKey) =>
        key.toLowerCase().endsWith(candidateKey)
      )
    ) {
      return value.replace(/:\/\/.*@/, '://****:****@') as T;
    }
  }

  if (value instanceof Object) {
    const obfuscatedObject: Record<string, string> = {};
    Object.entries(value).forEach(([subKey, subValue]) => {
      obfuscatedObject[subKey] = obfuscateValue(subKey, subValue);
    });
    return obfuscatedObject as T;
  }

  return value;
}

export default class EnvironmentConfig {
  private envValues: Readonly<EnvironmentValues>;
  private obfuscatedValues: Record<string, unknown>;

  constructor(envValues?: EnvironmentValues) {
    if (envValues) {
      this.envValues = { ...baseEnvironmentValues, ...envValues };
    } else {
      this.envValues = baseEnvironmentValues;
    }
    this.obfuscatedValues = _.cloneDeep<EnvironmentValues>(this.envValues);
    Object.entries(this.obfuscatedValues).forEach(([key, value]) => {
      this.obfuscatedValues[key] = obfuscateValue<typeof value>(key, value);
    });
  }

  getValues() {
    return this.envValues;
  }

  getObfuscatedValues() {
    return this.obfuscatedValues;
  }

  log() {
    logger.debug('Environment variables set:');
    Object.entries(this.obfuscatedValues)
      .sort(([key1], [key2]) => key1.localeCompare(key2))
      .filter(([, value]) => {
        return value !== undefined && value !== null;
      })
      .reduce((acc, [key, value]) => {
        acc.push(`${key}: ${JSON.stringify(value)}`);
        return acc;
      }, [] as string[])
      .forEach((configLine) => logger.debug(configLine));
  }
}
