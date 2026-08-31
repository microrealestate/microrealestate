import {
  EnvironmentConfig,
  formatError,
  logger,
  Service,
  type ServiceType
} from '@microrealestate/common';
import type { Application } from 'express';
import routes from './routes';

Main();

async function onStartUp(express: Application) {
  express.use(routes);
}

async function Main() {
  let service: ServiceType | null = null;
  try {
    service = Service.getInstance(
      new EnvironmentConfig({
        PORT: Number(process.env.PORT || 8900)
      })
    );

    await service.init({
      name: 'Reset service',
      useMongo: true,
      useRedis: true,
      onStartUp
    });

    await service.startUp();
  } catch (error) {
    logger.error(formatError(error as Error));
    service?.shutDown(-1);
  }
}
