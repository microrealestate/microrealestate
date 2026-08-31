import { Middlewares } from '@microrealestate/common';
import * as Express from 'express';
import { Controllers } from './controllers';

const routes = Express.Router();

routes.get('/tenants', Middlewares.asyncWrapper(Controllers.getAllTenants));

export default routes;
