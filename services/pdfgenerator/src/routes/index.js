const express = require('express');
const config = require('../config');
const {
  needAccessToken,
  checkOrganization,
} = require('@mre/common/utils/middlewares');
const templates = require('./templates');
const documents = require('./documents');

const routes = express.Router();
routes.use(needAccessToken(config.ACCESS_TOKEN_SECRET));
routes.use(checkOrganization());
routes.use('/templates', templates);
routes.use('/documents', documents);

module.exports = routes;
