import * as accountingManager from './managers/accountingmanager.js';
import * as dashboardManager from './managers/dashboardmanager.js';
import * as emailManager from './managers/emailmanager.js';
import * as leaseManager from './managers/leasemanager.js';
import * as occupantManager from './managers/occupantmanager.js';
import * as propertyManager from './managers/propertymanager.js';
import * as realmManager from './managers/realmmanager.js';
import * as rentManager from './managers/rentmanager.js';
import * as irlController from './controllers/irlController.js';
import { Middlewares, Service } from '@microrealestate/common';
import express from 'express';

export default function routes() {
  const { ACCESS_TOKEN_SECRET } = Service.getInstance().envConfig.getValues();
  const router = express.Router();

  // Apply common middlewares
  router.use(
    Middlewares.needAccessToken(ACCESS_TOKEN_SECRET),
    Middlewares.checkOrganization(),
    Middlewares.notRoles(['tenant'])
  );

  // --- Realms ---
  const realmsRouter = express.Router();
  realmsRouter.get('/', realmManager.all);
  realmsRouter.get('/:id', realmManager.one);
  realmsRouter.post('/', Middlewares.asyncWrapper(realmManager.add));
  realmsRouter.patch('/:id', Middlewares.asyncWrapper(realmManager.update));
  router.use('/realms', realmsRouter);

  // --- Dashboard ---
  const dashboardRouter = express.Router();
  dashboardRouter.get('/', Middlewares.asyncWrapper(dashboardManager.all));
  router.use('/dashboard', dashboardRouter);

  // --- Leases ---
  const leasesRouter = express.Router();
  leasesRouter.get('/', Middlewares.asyncWrapper(leaseManager.all));
  leasesRouter.get('/:id', Middlewares.asyncWrapper(leaseManager.one));
  leasesRouter.post('/', Middlewares.asyncWrapper(leaseManager.add));
  leasesRouter.patch('/:id', Middlewares.asyncWrapper(leaseManager.update));
  leasesRouter.delete('/:ids', Middlewares.asyncWrapper(leaseManager.remove));
  router.use('/leases', leasesRouter);

  // --- Tenants (Occupants) ---
  const occupantsRouter = express.Router();
  occupantsRouter.get('/', Middlewares.asyncWrapper(occupantManager.all));
  occupantsRouter.get('/:id', Middlewares.asyncWrapper(occupantManager.one));
  occupantsRouter.post('/', Middlewares.asyncWrapper(occupantManager.add));
  occupantsRouter.patch('/:id', Middlewares.asyncWrapper(occupantManager.update));
  occupantsRouter.delete('/:ids', Middlewares.asyncWrapper(occupantManager.remove));
  router.use('/tenants', occupantsRouter);

  // --- Rents ---
  const rentsRouter = express.Router();
  rentsRouter.patch('/payment/:id/:term', Middlewares.asyncWrapper(rentManager.updateByTerm));
  rentsRouter.get('/tenant/:id', Middlewares.asyncWrapper(rentManager.rentsOfOccupant));
  rentsRouter.get('/tenant/:id/:term', Middlewares.asyncWrapper(rentManager.rentOfOccupantByTerm));
  rentsRouter.get('/:year/:month', Middlewares.asyncWrapper(rentManager.all));
  router.use('/rents', rentsRouter);

  // --- Properties ---
  const propertiesRouter = express.Router();
  propertiesRouter.get('/', Middlewares.asyncWrapper(propertyManager.all));
  propertiesRouter.get('/:id', Middlewares.asyncWrapper(propertyManager.one));
  propertiesRouter.post('/', Middlewares.asyncWrapper(propertyManager.add));
  propertiesRouter.patch('/:id', Middlewares.asyncWrapper(propertyManager.update));
  propertiesRouter.delete('/:ids', Middlewares.asyncWrapper(propertyManager.remove));
  router.use('/properties', propertiesRouter);

  // --- Accounting ---
  router.get('/accounting/:year', Middlewares.asyncWrapper(accountingManager.all));
  router.get(
    '/csv/tenants/incoming/:year',
    Middlewares.asyncWrapper(accountingManager.csv.incomingTenants)
  );
  router.get(
    '/csv/tenants/outgoing/:year',
    Middlewares.asyncWrapper(accountingManager.csv.outgoingTenants)
  );
  router.get(
    '/csv/settlements/:year',
    Middlewares.asyncWrapper(accountingManager.csv.settlements)
  );

  // --- Emails ---
  const emailRouter = express.Router();
  emailRouter.post('/', Middlewares.asyncWrapper(emailManager.send));
  router.use('/emails', emailRouter);

  // --- IRL (Indice de Référence des Loyers) ---
  const irlRouter = express.Router();
  irlRouter.get('/', Middlewares.asyncWrapper(irlController.list));
  irlRouter.get('/latest', Middlewares.asyncWrapper(irlController.latest));
  irlRouter.post('/sync', Middlewares.asyncWrapper(irlController.sync));
  router.use('/irl', irlRouter);

  // --- Final API Mount ---
  const apiRouter = express.Router();
  apiRouter.use('/api/v2', router);

  return apiRouter;
}
