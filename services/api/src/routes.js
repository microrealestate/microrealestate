const express = require('express');
const config = require('./config');
const realmManager = require('./managers/realmmanager');
const dashboardManager = require('./managers/dashboardmanager');
const leaseManager = require('./managers/leasemanager');
const rentManager = require('./managers/rentmanager');
const occupantManager = require('./managers/occupantmanager');
const propertyManager = require('./managers/propertymanager');
const ownerManager = require('./managers/ownermanager');
const accountingManager = require('./managers/accountingmanager');
const emailManager = require('./managers/emailmanager');
const {
  needAccessToken,
  checkOrganization,
} = require('@mre/common/utils/middlewares');
const router = express.Router();

// protect the api access by checking the access token
router.use(needAccessToken(config.ACCESS_TOKEN_SECRET));

// update req with the user organizations
router.use(checkOrganization());

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

module.exports = apiRouter;
