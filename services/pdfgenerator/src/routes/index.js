import { Middlewares, Service } from '@microrealestate/common';
import express from 'express';
import documents from './documents';
import templates from './templates';

export default function () {
  const apiRoutes = express.Router('/pdfgenerator');
  apiRoutes.use(
    Middlewares.needAccessToken(
      Service.getInstance().envConfig.getValues().ACCESS_TOKEN_SECRET
    ),
    Middlewares.checkOrganization()
  );

  apiRoutes.use(
    '/templates',
    Middlewares.onlyCallers(['landlord']),
    templates()
  );
  apiRoutes.use('/documents', documents());

  const routes = express.Router();
  routes.use('/pdfgenerator', apiRoutes);
  return routes;
}
