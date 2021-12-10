const config = require('./config');

const logger = require('winston');
// configure default logger
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
  level: config.LOGGER_LEVEL,
  colorize: true,
});

const express = require('express');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');

const expressWinston = require('express-winston');
const routes = require('./routes');

// Init express
const app = express();
app.set('trust proxy', true);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride());

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

// Init routes
app.use(routes);

module.exports = app;
