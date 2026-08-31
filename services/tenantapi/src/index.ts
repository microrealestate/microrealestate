import {
  EnvironmentConfig,
  formatError,
  logger,
  Middlewares,
  Service,
  type ServiceType
} from '@microrealestate/common';
import type * as Express from 'express';
import routes from './routes';

Main();

async function onStartUp(application: Express.Application) {
  application.use(
    Middlewares.needAccessToken(
      Service.getInstance().envConfig.getValues().ACCESS_TOKEN_SECRET
    ),
    Middlewares.checkOrganization(),
    Middlewares.onlyCallers(['tenant']),
    Middlewares.needCallerEmail()
  );
  application.use('/tenantapi', routes);
}

async function Main() {
  let service: ServiceType | null = null;
  try {
    service = Service.getInstance(new EnvironmentConfig());

    await service.init({
      name: 'tenantapi',
      useRequestParsers: true,
      useMongo: true,
      onStartUp
    });

    await service.startUp();
  } catch (error) {
    logger.error(formatError(error as Error));
    service?.shutDown(-1);
  }
}
