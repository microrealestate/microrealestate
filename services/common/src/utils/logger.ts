import _ from 'lodash';
import winston from 'winston';

export function formatError(error: unknown): {
  level: string;
  message: string;
  stack?: string;
} {
  const err = error instanceof Error ? error : new Error(String(error));
  return {
    level: 'error',
    message: 'an error has occurred',
    stack: err.stack
  };
}

const MAX_STRING_LENGTH = 8 * 1024;

function maskString(value: string): string {
  let replaced = value;
  // mask emails
  replaced = replaced.replace(
    /(\b[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+\b)/g,
    '****@****.***'
  );

  // mask db connection urls
  replaced = replaced.replace(
    /(?:\/\/)(?:[^:@\s/]*(?::[^@\s/]+)?@)(?:[^\s:@/]+(?::\d+)?)/g,
    '//****:****@****/****'
  );

  // mask https urls
  replaced = replaced.replace(/(https?:\/\/[^\s]+)/g, 'http(s)://****');

  // mask jwts
  replaced = replaced.replace(
    /\beyJ[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]+/g,
    '****.jwt.****'
  );

  // mask authorization schemes
  replaced = replaced.replace(
    /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi,
    '$1 ****'
  );

  // mask secrets passed in a query string
  replaced = replaced.replace(
    /([?&](?:otp|token|access_token|refresh_token|sessionToken|code|key|secret|password|apikey)=)[^&\s]+/gi,
    '$1****'
  );

  // mask provider api keys
  replaced = replaced.replace(
    /\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{8,}/g,
    '$1_$2_****'
  );

  return _.truncate(replaced, {
    length: MAX_STRING_LENGTH,
    omission: '...[truncated]'
  });
}

function buildDevLine(info: winston.Logform.TransformableInfo): string {
  let message = info.message ? ` ${info.message}` : '';
  if (info.stack) {
    message = message ? `${message}\n${info.stack}` : ` ${info.stack}`;
  }

  let statusCode = info.statusCode ? ` ${info.statusCode}` : '';
  if (
    info.meta &&
    typeof info.meta === 'object' &&
    'res' in info.meta &&
    info.meta.res &&
    typeof info.meta.res === 'object' &&
    'statusCode' in info.meta.res
  ) {
    statusCode = ` ${info.meta.res.statusCode}`;
  }
  return `${info.timestamp} <${info.level.toUpperCase()[0]}>${statusCode}${message}`;
}

const formats = [
  winston.format.errors({ stack: true }),
  winston.format.timestamp({
    format: 'YYYY-MM-DD[T]HH:mm:ss.SSS'
  }),
  winston.format.printf((info) => maskString(buildDevLine(info)))
];

const consoleTransport = new winston.transports.Console({
  level: process.env.LOGGER_LEVEL || 'debug',
  format: winston.format.combine(...formats),
  handleExceptions: true,
  handleRejections: true
});

export const transports = [consoleTransport];

const logger = winston.createLogger({
  format: winston.format.errors({ stack: true }),
  transports
});

export default logger;
