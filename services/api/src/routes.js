import * as accountingManager from './managers/accountingmanager.js';
import * as dashboardManager from './managers/dashboardmanager.js';
import * as emailManager from './managers/emailmanager.js';
import * as leaseManager from './managers/leasemanager.js';
import * as occupantManager from './managers/occupantmanager.js';
import * as ownerManager from './managers/ownermanager.js';
import * as propertyManager from './managers/propertymanager.js';
import * as realmManager from './managers/realmmanager.js';
import * as rentManager from './managers/rentmanager.js';
import { Middlewares, Service } from '@microrealestate/common';
import express from 'express';

export default function routes() {
  const { ACCESS_TOKEN_SECRET } = Service.getInstance().envConfig.getValues();
  const router = express.Router();
  router.use(
    // protect the api access by checking the access token
    Middlewares.needAccessToken(ACCESS_TOKEN_SECRET),
    // update req with the user organizations
    Middlewares.checkOrganization(),
    // forbid access to tenant
    Middlewares.notRoles(['tenant'])
  );

  const realmsRouter = express.Router();
  realmsRouter.get('/', realmManager.all);
  realmsRouter.get('/:id', realmManager.one);
  realmsRouter.post('/', realmManager.add);
  realmsRouter.patch('/:id', realmManager.update);
  router.use('/realms', realmsRouter);

  const dashboardRouter = express.Router();
  dashboardRouter.get('/', dashboardManager.all);
  router.use('/dashboard', dashboardRouter);

  const leasesRouter = express.Router();
  leasesRouter.get('/', leaseManager.all);
  leasesRouter.get('/:id', leaseManager.one);
  leasesRouter.post('/', leaseManager.add);
  leasesRouter.patch('/:id', leaseManager.update);
  leasesRouter.delete('/:ids', leaseManager.remove);
  router.use('/leases', leasesRouter);

  const occupantsRouter = express.Router();
  occupantsRouter.get('/', occupantManager.all);
  occupantsRouter.get('/:id', occupantManager.one);
  occupantsRouter.post('/', occupantManager.add);
  occupantsRouter.patch('/:id', occupantManager.update);
  occupantsRouter.delete('/:ids', occupantManager.remove);
  router.use('/tenants', occupantsRouter);

  const rentsRouter = express.Router();
  rentsRouter.patch('/payment/:id/:term', rentManager.updateByTerm);
  rentsRouter.get('/tenant/:id', rentManager.rentsOfOccupant);
  rentsRouter.get('/tenant/:id/:term', rentManager.rentOfOccupantByTerm);
  rentsRouter.get('/:year/:month', rentManager.all);
  router.use('/rents', rentsRouter);

  const propertiesRouter = express.Router();
  propertiesRouter.get('/', propertyManager.all);
  propertiesRouter.get('/:id', propertyManager.one);
  propertiesRouter.post('/', propertyManager.add);
  propertiesRouter.patch('/:id', propertyManager.update);
  propertiesRouter.delete('/:ids', propertyManager.remove);
  router.use('/properties', propertiesRouter);

  router.get('/accounting/:year', accountingManager.all);
  router.get(
    '/csv/tenants/incoming/:year',
    accountingManager.csv.incomingTenants
  );
  router.get(
    '/csv/tenants/outgoing/:year',
    accountingManager.csv.outgoingTenants
  );
  router.get('/csv/settlements/:year', accountingManager.csv.settlements);

  const ownerRouter = express.Router();
  ownerRouter.get('/', ownerManager.all);
  ownerRouter.patch('/:id', ownerManager.update);
  router.use('/owner', ownerRouter);

  const emailRouter = express.Router();
  emailRouter.post('/', emailManager.send);
  router.use('/emails', emailRouter);

  const apiRouter = express.Router();
  apiRouter.use('/api/v2', router);

  return apiRouter;
}
