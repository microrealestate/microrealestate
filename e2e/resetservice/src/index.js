const express = require('express');
const mongoose = require('mongoose');
const expressWinston = require('express-winston');
const logger = require('winston');
const config = require('./config');
const redisClient = require('./redisclient');

process.on('SIGINT', async () => {
  await Promise.all([disconnectRedis(), disconnectMongo()]);
  process.exit(0);
});

let connection;
async function connectMongo() {
  if (!connection) {
    logger.debug(`db connecting to ${config.MONGO_URL}...`);
    connection = await mongoose.connect(config.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.debug('Mongo ready');
  }
}

async function disconnectMongo() {
  if (connection) {
    await mongoose.disconnect();
  }
}

async function connectRedis() {
  logger.debug(`db connecting to ${config.TOKEN_DB_URL}...`);
  await redisClient.connect(
    config.TOKEN_DB_URL,
    config.TOKEN_DB_PASSWORD
      ? { password: config.TOKEN_DB_PASSWORD }
      : undefined
  );
  logger.debug('Redis ready');
}

async function disconnectRedis() {
  if (redisClient.client) {
    await redisClient.quit();
  }
}

async function startService() {
  // configure default logger
  logger.remove(logger.transports.Console);
  logger.add(logger.transports.Console, {
    level: config.LOGGER_LEVEL,
    colorize: true,
  });

  logger.debug('starting reset service...');
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

  // body parser
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // api
  app.delete('/reset', (req, res) => {
    const dropDB = async () => {
      try {
        await Promise.all(
          [
            'accounts',
            'contracts',
            'documents',
            'emails',
            'landloards',
            'leases',
            'occupants',
            'properties',
            'realms',
            'templates',
          ].map((collection) =>
            mongoose.connection.db
              .dropCollection(collection)
              .catch(console.error)
          )
        );

        const keys = await redisClient.keys('*');
        if (keys?.length) {
          await Promise.all(keys.map((key) => redisClient.del(key)));
        }
      } catch (error) {
        console.log(error);
        logger.error(error);
        return res
          .status(500)
          .send('unexpected error when reseting the databases');
      }

      return res.status(200).send('success');
    };

    dropDB();
  });

  try {
    // Connect to DB
    await Promise.all([connectMongo(), connectRedis()]);

    // Run server
    const http_port = config.PORT;
    await app.listen(http_port).on('error', (error) => {
      throw new Error(error);
    });
    logger.debug(`Reset service listening on port ${http_port}`);
    logger.info(`Databases ${config.MONGO_URL}`);
    logger.info('Reset service ready');
  } catch (exc) {
    logger.error(exc.message);
    await Promise.all([disconnectRedis(), disconnectMongo()]);
    process.exit(1);
  }
}

startService();
