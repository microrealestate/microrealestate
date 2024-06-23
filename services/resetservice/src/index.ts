import * as Express from 'express';
import { EnvironmentConfig, Service } from '@microrealestate/common';
import logger from 'winston';
import routes from './routes.js';

Main();

async function onStartUp(express: Express.Application) {
  express.use(routes);
}

async function Main() {
  let service;
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
    logger.error(String(error));
    service?.shutDown(-1);
  }
}
