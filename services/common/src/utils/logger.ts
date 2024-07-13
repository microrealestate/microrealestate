import logger from 'winston';

// configure default logger
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    level: process.env.LOGGER_LEVEL || 'debug',
    colorize: false,
    json: false
});

export default logger;