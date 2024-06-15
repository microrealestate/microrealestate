import * as Express from 'express';
import { Controllers } from './controllers/index.js';

const routes = Express.Router();

routes.get('/tenants', Controllers.getAllTenants);
routes.get('/tenant/:tenantId', Controllers.getOneTenant);

export default routes;
