import { Middlewares, Service } from '@microrealestate/common';
import express from 'express';
import * as accountingManager from './managers/accountingmanager';
import * as dashboardManager from './managers/dashboardmanager';
import * as emailManager from './managers/emailmanager';
import * as leaseManager from './managers/leasemanager';
import * as occupantManager from './managers/occupantmanager';
import * as propertyManager from './managers/propertymanager';
import * as realmManager from './managers/realmmanager';
import * as rentManager from './managers/rentmanager';
import * as todoManager from './managers/todomanager';

export default function routes(): express.Router {
  const { ACCESS_TOKEN_SECRET } = Service.getInstance().envConfig.getValues();
  const router = express.Router();

  router.use(
    // protect the api access by checking the access token
    Middlewares.needAccessToken(ACCESS_TOKEN_SECRET),
    // update req with the organization resolved from the access token
    Middlewares.checkOrganization(),
    // forbid access to tenant
    Middlewares.onlyCallers(['landlord'])
  );

  const realmsRouter = express.Router();
  realmsRouter.get('/', Middlewares.asyncWrapper(realmManager.get));
  realmsRouter.post('/', Middlewares.asyncWrapper(realmManager.add));
  realmsRouter.patch('/:id', Middlewares.asyncWrapper(realmManager.update));
  realmsRouter.post(
    '/:id/test-smtp',
    Middlewares.asyncWrapper(realmManager.testSmtp)
  );
  router.use('/realms', realmsRouter);

  const dashboardRouter = express.Router();
  dashboardRouter.get(
    '/tenants/count/:year',
    Middlewares.asyncWrapper(dashboardManager.tenantCount)
  );
  dashboardRouter.get(
    '/properties/count',
    Middlewares.asyncWrapper(dashboardManager.propertyCount)
  );
  dashboardRouter.get(
    '/occupancy/:year',
    Middlewares.asyncWrapper(dashboardManager.occupancyRate)
  );
  dashboardRouter.get(
    '/revenues/breakdown/:year',
    Middlewares.asyncWrapper(dashboardManager.revenuesBreakdown)
  );
  dashboardRouter.get(
    '/revenues/:year',
    Middlewares.asyncWrapper(dashboardManager.totalYearRevenues)
  );
  dashboardRouter.get(
    '/revenues/:year/:month',
    Middlewares.asyncWrapper(dashboardManager.monthRevenues)
  );
  dashboardRouter.get(
    '/rents/top-unpaid/:year/:month',
    Middlewares.asyncWrapper(dashboardManager.topUnpaid)
  );
  dashboardRouter.get(
    '/rents/count/:year/:month',
    Middlewares.asyncWrapper(dashboardManager.rentsCount)
  );
  dashboardRouter.get(
    '/contracts/near-renewal',
    Middlewares.asyncWrapper(dashboardManager.contractsNearRenewal)
  );
  router.use('/dashboard', dashboardRouter);

  const leasesRouter = express.Router();
  leasesRouter.get('/', Middlewares.asyncWrapper(leaseManager.all));
  leasesRouter.get('/:id', Middlewares.asyncWrapper(leaseManager.one));
  leasesRouter.post('/', Middlewares.asyncWrapper(leaseManager.add));
  leasesRouter.patch('/:id', Middlewares.asyncWrapper(leaseManager.update));
  leasesRouter.delete('/:ids', Middlewares.asyncWrapper(leaseManager.remove));
  router.use('/leases', leasesRouter);

  const occupantsRouter = express.Router();
  occupantsRouter.get('/', Middlewares.asyncWrapper(occupantManager.all));
  occupantsRouter.get('/:id', Middlewares.asyncWrapper(occupantManager.one));
  occupantsRouter.post('/', Middlewares.asyncWrapper(occupantManager.add));
  occupantsRouter.patch(
    '/:id',
    Middlewares.asyncWrapper(occupantManager.update)
  );
  occupantsRouter.delete(
    '/:ids',
    Middlewares.asyncWrapper(occupantManager.remove)
  );
  router.use('/tenants', occupantsRouter);

  const rentsRouter = express.Router();
  rentsRouter.patch(
    '/payment/:id/:term',
    Middlewares.asyncWrapper(rentManager.updateByTerm)
  );
  rentsRouter.get(
    '/tenant/:id',
    Middlewares.asyncWrapper(rentManager.rentsOfOccupant)
  );
  rentsRouter.get(
    '/tenant/:id/:term',
    Middlewares.asyncWrapper(rentManager.rentOfOccupantByTerm)
  );
  rentsRouter.get('/:year/:month', Middlewares.asyncWrapper(rentManager.all));
  router.use('/rents', rentsRouter);

  const propertiesRouter = express.Router();
  propertiesRouter.get('/', Middlewares.asyncWrapper(propertyManager.all));
  propertiesRouter.get('/:id', Middlewares.asyncWrapper(propertyManager.one));
  propertiesRouter.post('/', Middlewares.asyncWrapper(propertyManager.add));
  propertiesRouter.patch(
    '/:id',
    Middlewares.asyncWrapper(propertyManager.update)
  );
  propertiesRouter.delete(
    '/:ids',
    Middlewares.asyncWrapper(propertyManager.remove)
  );
  router.use('/properties', propertiesRouter);

  router.get(
    '/accounting/:year',
    Middlewares.asyncWrapper(accountingManager.all)
  );
  router.get(
    '/csv/tenants/incoming/:year',
    Middlewares.asyncWrapper(accountingManager.incomingTenantsAsCsv)
  );
  router.get(
    '/csv/tenants/outgoing/:year',
    Middlewares.asyncWrapper(accountingManager.outgoingTenantsAsCsv)
  );
  router.get(
    '/csv/settlements/:year',
    Middlewares.asyncWrapper(accountingManager.settlementsAsCsv)
  );

  const todosRouter = express.Router();
  todosRouter.get('/', Middlewares.asyncWrapper(todoManager.allTodos));
  router.use('/todos', todosRouter);

  const emailRouter = express.Router();
  emailRouter.post('/', Middlewares.asyncWrapper(emailManager.send));
  router.use('/emails', emailRouter);

  const apiRouter = express.Router();

  apiRouter.use('/api/v2', router);

  return apiRouter;
}
