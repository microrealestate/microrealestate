const express = require('express');
const cookieParser = require('cookie-parser');
const expressWinston = require('express-winston');
const logger = require('winston');
const mongoose = require('mongoose');
const config = require('./config');
const redisClient = require('./redisclient');
const apiRouter = require('./apirouter');

const startApplication = async (apiRouter) => {
  // configure default logger
  logger.remove(logger.transports.Console);
  logger.add(logger.transports.Console, {
    level: config.LOGGER_LEVEL,
    colorize: true,
  });

  logger.debug('starting service...');
  const app = express();

  // Express log through out winston
  app.use(
    expressWinston.logger({
      transports: [
        new logger.transports.Console({
          json: false,
          colorize: true,
        }),
      ],
      meta: false, // optional: control whether you want to log the meta data about the request (default to true)
      msg: String, //'HTTP {{req.method}} {{req.url}}', // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
      expressFormat: true, // Use the default Express/morgan request formatting, with the same colors. Enabling this will override any msg and colorStatus if true. Will only output colors on transports with colorize set to true
      colorStatus: true, // Color the status code, using the Express/morgan color palette (default green, 3XX cyan, 4XX yellow, 5XX red). Will not be recognized if expressFormat is true
      //ignoreRoute: function( /*req, res*/ ) {
      //    return false;
      //} // optional: allows to skip some log messages based on request and/or response
    })
  );

  app.use(
    expressWinston.errorLogger({
      transports: [
        new logger.transports.Console({
          json: false,
          colorize: true,
        }),
      ],
    })
  );

  // parse cookies
  app.use(cookieParser());

  // parse application/x-www-form-urlencoded
  app.use(express.urlencoded({ extended: false }));

  // parse application/json
  app.use(express.json());

  // expose api
  app.use(apiRouter);

  await app.listen(config.PORT).on('error', (error) => {
    throw new Error(error);
  });

  return app;
};

process.on('SIGINT', async () => {
  await Promise.all[(redisClient.quit(), mongoose.disconnect())];
  process.exit(0);
});

///////////////////////////////////////////////////////////////////////////////
//  Main
///////////////////////////////////////////////////////////////////////////////
(async () => {
  // Connect to Redis
  try {
    await redisClient.connect(
      config.TOKEN_DB_URL,
      config.TOKEN_DB_PASSWORD
        ? { password: config.TOKEN_DB_PASSWORD }
        : undefined
    );
    await redisClient.monitor();
  } catch (exc) {
    logger.error(exc);
    process.exit(1);
  }

  // Connect to Mongo
  try {
    await mongoose.connect(config.BASE_DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (exc) {
    logger.error(exc);
    await redisClient.quit();
    process.exit(1);
  }

  // Run server
  try {
    await startApplication(apiRouter);
    logger.debug(`Rest API listening on port ${config.PORT}`);
    logger.info(`NODE_ENV ${process.env.NODE_ENV}`);
    logger.info(
      `Databases ${[config.TOKEN_DB_URL, config.BASE_DB_URL].join(', ')}`
    );
    logger.info('Authenticator service ready');
  } catch (exc) {
    logger.error(exc.message);
    await Promise.all[(redisClient.quit(), mongoose.disconnect())];
    process.exit(1);
  }
})();
