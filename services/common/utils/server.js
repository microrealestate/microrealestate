const logger = require('winston');
const express = require('express');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const expressWinston = require('express-winston');
const mongoosedb = require('../models/db');
const redis = require('../models/redis');
const config = require('../config');

// configure default logger
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
  level: config.LOGGER_LEVEL,
  colorize: true,
});

class Service {
  async init({
    name,
    port,
    useMongo,
    useRedis,
    useAxios,
    useRequestParsers = true,
    onStartUp,
    onShutDown,
  }) {
    this.name = name;
    this.port = port;
    this.useAxios = useAxios;
    this.onStartUp = onStartUp;
    this.onShutDown = onShutDown;
    this.useMongo = useMongo;
    this.useRedis = useRedis;

    if (this.useAxios) {
      require('./httpinterceptors')();
    }

    this.express = express();

    if (useRequestParsers) {
      this.express.use(cookieParser());
      this.express.use(express.urlencoded({ extended: true }));
      this.express.use(express.json());
      this.express.use(methodOverride());
    }

    this.express.use(
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

    this.express.use(
      expressWinston.errorLogger({
        transports: [
          new logger.transports.Console({
            json: false,
            colorize: true,
          }),
        ],
      })
    );
  }

  async startUp() {
    const startService = () =>
      new Promise((resolve, reject) => {
        this.express
          .listen(this.port, () => {
            logger.info(
              `Service ${this.name} ready and listening on port ${this.port}`
            );
            resolve();
          })
          .on('error', async (err) => {
            logger.error(err);
            if (this.useMongo) {
              try {
                await mongoosedb.disconnect();
              } catch (error) {
                logger.error(error);
              }
            }
            reject(err);
          });
      });
    logger.info(`Starting service ${this.name}...`);
    config.log();
    await this.onStartUp?.(this.express);
    if (this.useMongo) {
      await mongoosedb.connect();
    }
    if (this.useRedis) {
      await redis.connect();
      await redis.monitor();
    }
    await startService();
  }

  async shutDown(errCode) {
    if (this.useMongo) {
      try {
        await mongoosedb.disconnect();
      } catch (error) {
        logger.error(error);
      }
    }
    if (this.useRedis) {
      try {
        await redis.disconnect();
      } catch (error) {
        logger.error(error);
      }
    }
    await this.onShutDown?.();
    process.exit(errCode);
  }
}

const serviceInstance = new Service();

process.on('SIGINT', () => {
  serviceInstance.shutdown(0);
});

module.exports = serviceInstance;
