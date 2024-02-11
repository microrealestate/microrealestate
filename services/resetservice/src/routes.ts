import * as Express from 'express';
import logger from 'winston';
import {
  ResetServiceAPI,
} from '@microrealestate/types';
import { Service } from '@microrealestate/typed-common';

const routes = Express.Router();
routes.delete('/reset', (
  req: Express.Request<ResetServiceAPI.DeleteAll.Request>, 
  res: Express.Response<ResetServiceAPI.DeleteAll.Response>
) => {
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
          'templates',
        ].map((collection) =>
          mongoClient?.connection().dropCollection(collection).catch(console.error)
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
