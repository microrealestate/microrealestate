import * as Express from 'express';
import { Middlewares, Service } from '@microrealestate/common';

const routes = Express.Router();
routes.delete(
  '/reset',
  Middlewares.asyncWrapper(
    async (req: Express.Request, res: Express.Response<string>) => {
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
        ].map((collection) =>
          mongoClient?.dropCollection(collection).catch(console.error)
        )
      );

      const redis = Service.getInstance().redisClient;
      const keys = await redis?.keys('*');
      if (keys?.length) {
        await Promise.all(keys.map((key) => redis?.del(key)));
      }
      return res.status(200).send('success');
    }
  )
);

export default routes;
