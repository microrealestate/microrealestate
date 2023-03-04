const express = require('express');
const config = require('../config');
const {
  needAccessToken,
  checkOrganization,
} = require('@microrealestate/common/utils/middlewares');
const templates = require('./templates');
const documents = require('./documents');

const apiRoutes = express.Router('/pdfgenerator');
apiRoutes.use(needAccessToken(config.ACCESS_TOKEN_SECRET));
apiRoutes.use(checkOrganization());
apiRoutes.use('/templates', templates);
apiRoutes.use('/documents', documents);

const routes = express.Router();
routes.use('/pdfgenerator', apiRoutes);

module.exports = routes;
