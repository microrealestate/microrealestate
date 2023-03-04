const express = require('express');
const logger = require('winston');
const redis = require('@microrealestate/common/models/redis');
const mongoosedb = require('@microrealestate/common/models/db');

const routes = express.Router();
routes.delete('/reset', (req, res) => {
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
          mongoosedb
            .connection()
            .dropCollection(collection)
            .catch(console.error)
        )
      );

      const keys = await redis.keys('*');
      if (keys?.length) {
        await Promise.all(keys.map((key) => redis.del(key)));
      }
    } catch (error) {
      logger.error(error);
      return res
        .status(500)
        .send('unexpected error when reseting the databases');
    }

    return res.status(200).send('success');
  };

  dropDB();
});

module.exports = routes;
