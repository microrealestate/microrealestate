import * as Express from 'express';
import {
  EnvironmentConfig,
  Middlewares,
  Service
} from '@microrealestate/common';
import logger from 'winston';
import routes from './routes.js';

Main();

async function onStartUp(application: Express.Application) {
  application.use(
    Middlewares.needAccessToken(
      Service.getInstance().envConfig.getValues().ACCESS_TOKEN_SECRET
    ),
    Middlewares.checkOrganization(),
    Middlewares.onlyTypes(['user']),
    Middlewares.onlyRoles(['tenant'])
  );
  application.use('/tenantapi', routes);
}

async function Main() {
  let service;
  try {
    service = Service.getInstance(
      new EnvironmentConfig({
        DEMO_MODE: process.env.DEMO_MODE
          ? process.env.DEMO_MODE.toLowerCase() === 'true'
          : undefined
      })
    );

    await service.init({
      name: 'tenantapi',
      useRequestParsers: true,
      useMongo: true,
      onStartUp
    });

    await service.startUp();
  } catch (error) {
    logger.error(String(error));
    service?.shutDown(-1);
  }
}
