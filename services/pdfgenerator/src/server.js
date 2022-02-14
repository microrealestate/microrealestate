const express = require('express');
const locale = require('locale');
const expressWinston = require('express-winston');
const logger = require('winston');
const mongoosedb = require('@mre/common/models/db');
const pdf = require('./pdf');
const config = require('./config');
const routes = require('./routes');

async function exit(code = 0) {
  try {
    await pdf.exit();
  } catch (err) {
    // continue regardless of error
  }
  process.exit(code);
}

process.on('SIGINT', async () => {
  await exit(0);
});

async function start() {
  // configure default logger
  logger.remove(logger.transports.Console);
  logger.add(logger.transports.Console, {
    level: config.LOGGER_LEVEL,
    colorize: true,
  });

  logger.debug('starting rest API...');
  const app = express();

  // Express log with winston
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

  // parse locale
  app.use(locale(['fr-FR', 'en-US', 'pt-BR', 'de-DE'], 'en-US'));

  // body parser
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // api
  app.use('/pdfgenerator', routes);

  try {
    // Connect to Mongo
    await mongoosedb.connect();

    // Start pdf engine
    await pdf.start();

    // Run server
    const http_port = config.PORT;
    await app.listen(http_port).on('error', (error) => {
      throw new Error(error);
    });
    config.log();
    logger.debug(`Rest API listening on port ${http_port}`);
    logger.info('PdfGenerator ready');
  } catch (exc) {
    logger.error(exc.message);
    exit(1);
  }
}

module.exports = {
  start,
};
