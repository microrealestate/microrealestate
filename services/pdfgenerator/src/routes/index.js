// eslint-disable-next-line import/no-unresolved
import { Middlewares, Service } from '@microrealestate/common';
import documents from './documents.js';
import express from 'express';
import templates from './templates.js';

export default function () {
  const apiRoutes = express.Router('/pdfgenerator');
  apiRoutes.use(
    Middlewares.needAccessToken(
      Service.getInstance().envConfig.getValues().ACCESS_TOKEN_SECRET
    ),
    Middlewares.checkOrganization()
  );
  apiRoutes.use('/templates', templates());
  apiRoutes.use('/documents', documents());

  const routes = express.Router();
  routes.use('/pdfgenerator', apiRoutes);
  return routes;
}
