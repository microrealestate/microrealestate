import {
  formatError,
  logger,
  Middlewares,
  Service
} from '@microrealestate/common';
import Express, { type Request, type Response } from 'express';

const routes = Express.Router();
routes.delete(
  '/reset',
  Middlewares.asyncWrapper(async (_req: Request, res: Response) => {
    const mongoClient = Service.getInstance().mongoClient;
    await Promise.all(
      [
        'accounts',
        'documents',
        'emails',
        'leases',
        'occupants',
        'properties',
        'realms',
        'templates'
      ].map((collection) =>
        mongoClient
          ?.dropCollection(collection)
          .catch((error) => logger.error(formatError(error)))
      )
    );

    const redis = Service.getInstance().redisClient;
    const keys = await redis?.keys('*');
    if (keys?.length) {
      await Promise.all(keys.map((key) => redis?.del(key)));
    }
    res.status(200).send('success');
  })
);

export default routes;
