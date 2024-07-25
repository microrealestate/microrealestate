import winston from 'winston';

export const transports = [
  new winston.transports.Console({
    level: process.env.LOGGER_LEVEL || 'debug',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DDTHH:mm:ss.sss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.printf((info) => {
        let message = info.message;
        if (info.stack) {
          message = `${info.message}${info.stack}`;
        }

        return `${info.timestamp} <${info.level.toUpperCase()[0]}> ${message}`;
      })
    )
  })
];

const logger = winston.createLogger({
  transports
});

export default logger;
