import * as Express from 'express';
import logger from 'winston';
import { Service } from '@microrealestate/typed-common';

const routes = Express.Router();
routes.delete('/reset', (req: Express.Request, res: Express.Response) => {
  const dropDB = async () => {
    try {
      const mongoClient = Service.getInstance().mongoClient;
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
          'templates'
        ].map(
          (collection) =>
            mongoClient?.dropCollection(collection).catch(console.error)
        )
      );

      const redis = Service.getInstance().redisClient;
      const keys = await redis?.keys('*');
      if (keys?.length) {
        await Promise.all(keys.map((key) => redis?.del(key)));
      }
    } catch (error) {
      logger.error(String(error));
      return res
        .status(500)
        .send('unexpected error when reseting the databases');
    }

    return res.status(200).send('success');
  };

  dropDB();
});

export default routes;
