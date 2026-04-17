import * as accountingManager from './managers/accountingmanager.js';
import * as attachmentManager from './managers/attachmentmanager.js';
import * as auditLogManager from './managers/auditlogmanager.js';
import * as backupManager from './managers/backupmanager.js';
import * as contractorManager from './managers/contractormanager.js';
import * as dashboardManager from './managers/dashboardmanager.js';
import * as dbBackupManager from './managers/dbbackupmanager.js';
import * as emailManager from './managers/emailmanager.js';
import * as leaseManager from './managers/leasemanager.js';
import * as notesManager from './managers/notesmanager.js';
import * as occupantManager from './managers/occupantmanager.js';
import * as projectManager from './managers/projectmanager.js';
import * as propertyManager from './managers/propertymanager.js';
import * as propertyTaxStatementManager from './managers/propertytaxstatementmanager.js';
import * as realmManager from './managers/realmmanager.js';
import * as rentManager from './managers/rentmanager.js';
import * as utilityAccountManager from './managers/utilityaccountmanager.js';
import * as utilityManager from './managers/utilitymanager.js';
import { Middlewares, Service } from '@microrealestate/common';
import express from 'express';
import { upload } from './utils/upload.js';

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
  realmsRouter.post('/', Middlewares.asyncWrapper(realmManager.add));
  realmsRouter.post(
    '/:id/email/test',
    Middlewares.asyncWrapper(realmManager.sendTestEmail)
  );
  realmsRouter.post(
    '/:id/members/invite',
    Middlewares.asyncWrapper(realmManager.inviteMember)
  );
  realmsRouter.patch('/:id', Middlewares.asyncWrapper(realmManager.update));
  router.use('/realms', realmsRouter);

  const dashboardRouter = express.Router();
  dashboardRouter.get('/', Middlewares.asyncWrapper(dashboardManager.all));
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

  const notesRouter = express.Router();

  // list notes
  notesRouter.get('/', Middlewares.asyncWrapper(notesManager.all));

  // create note
  notesRouter.post('/', Middlewares.asyncWrapper(notesManager.add));

  // attachments (upload)
  notesRouter.post(
    '/:id/attachments',
    upload.single('file'),
    Middlewares.asyncWrapper(notesManager.uploadAttachment)
  );

  // attachments (download)
  notesRouter.get(
    '/:id/attachments/:attachmentId',
    Middlewares.asyncWrapper(notesManager.downloadAttachment)
  );

  // get single note
  notesRouter.get('/:id', Middlewares.asyncWrapper(notesManager.one));

  // update/delete note
  notesRouter.patch('/:id', Middlewares.asyncWrapper(notesManager.update));
  notesRouter.delete('/:id', Middlewares.asyncWrapper(notesManager.remove));

  router.use('/notes', notesRouter);

  occupantsRouter.delete(
    '/:ids',
    Middlewares.asyncWrapper(occupantManager.remove)
  );
  router.use('/tenants', occupantsRouter);

  const contractorsRouter = express.Router();
  contractorsRouter.get('/', Middlewares.asyncWrapper(contractorManager.all));
  contractorsRouter.get(
    '/work',
    Middlewares.asyncWrapper(contractorManager.allWork)
  );
  contractorsRouter.get(
    '/:id',
    Middlewares.asyncWrapper(contractorManager.one)
  );
  contractorsRouter.post('/', Middlewares.asyncWrapper(contractorManager.add));
  contractorsRouter.patch(
    '/:id',
    Middlewares.asyncWrapper(contractorManager.update)
  );
  contractorsRouter.post(
    '/:id/reviews',
    Middlewares.asyncWrapper(contractorManager.addReview)
  );
  contractorsRouter.delete(
    '/:ids',
    Middlewares.asyncWrapper(contractorManager.remove)
  );

  // Work records endpoints
  contractorsRouter.get(
    '/:contractorId/work',
    Middlewares.asyncWrapper(contractorManager.getWork)
  );
  contractorsRouter.get(
    '/:contractorId/work/:workId',
    Middlewares.asyncWrapper(contractorManager.getWorkById)
  );
  contractorsRouter.post(
    '/:contractorId/work',
    Middlewares.asyncWrapper(contractorManager.addWork)
  );
  contractorsRouter.patch(
    '/work/:workId',
    Middlewares.asyncWrapper(contractorManager.updateWork)
  );
  contractorsRouter.delete(
    '/work/:workId',
    Middlewares.asyncWrapper(contractorManager.removeWork)
  );

  router.use('/contractors', contractorsRouter);

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
  propertiesRouter.get(
    '/:id/units',
    Middlewares.asyncWrapper(propertyManager.units)
  );
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

  const emailRouter = express.Router();
  emailRouter.post('/', Middlewares.asyncWrapper(emailManager.send));
  router.use('/emails', emailRouter);

  const attachmentsRouter = express.Router();
  attachmentsRouter.post(
    '/',
    upload.single('file'),
    Middlewares.asyncWrapper(attachmentManager.upload)
  );
  attachmentsRouter.get('/', Middlewares.asyncWrapper(attachmentManager.list));
  attachmentsRouter.get(
    '/:id/download',
    Middlewares.asyncWrapper(attachmentManager.download)
  );
  attachmentsRouter.delete(
    '/:id',
    Middlewares.asyncWrapper(attachmentManager.remove)
  );
  router.use('/attachments', attachmentsRouter);

  const projectsRouter = express.Router();
  projectsRouter.get('/', Middlewares.asyncWrapper(projectManager.all));
  projectsRouter.get('/:id', Middlewares.asyncWrapper(projectManager.one));
  projectsRouter.post('/', Middlewares.asyncWrapper(projectManager.add));
  projectsRouter.patch('/:id', Middlewares.asyncWrapper(projectManager.update));
  projectsRouter.delete(
    '/:id',
    Middlewares.asyncWrapper(projectManager.remove)
  );
  router.use('/projects', projectsRouter);

  const utilitiesRouter = express.Router();
  utilitiesRouter.get('/', Middlewares.asyncWrapper(utilityManager.all));
  utilitiesRouter.post(
    '/parse-upload',
    upload.single('file'),
    Middlewares.asyncWrapper(utilityManager.parseUpload)
  );
  utilitiesRouter.get('/:id', Middlewares.asyncWrapper(utilityManager.one));
  utilitiesRouter.post('/', Middlewares.asyncWrapper(utilityManager.add));
  utilitiesRouter.patch(
    '/:id',
    Middlewares.asyncWrapper(utilityManager.update)
  );
  utilitiesRouter.delete(
    '/:id',
    Middlewares.asyncWrapper(utilityManager.remove)
  );
  router.use('/utilities', utilitiesRouter);

  const utilityAccountsRouter = express.Router();
  utilityAccountsRouter.get(
    '/',
    Middlewares.asyncWrapper(utilityAccountManager.all)
  );
  utilityAccountsRouter.get(
    '/:id',
    Middlewares.asyncWrapper(utilityAccountManager.one)
  );
  utilityAccountsRouter.post(
    '/',
    Middlewares.asyncWrapper(utilityAccountManager.add)
  );
  utilityAccountsRouter.post(
    '/:id/bills',
    Middlewares.asyncWrapper(utilityAccountManager.addBill)
  );
  utilityAccountsRouter.patch(
    '/:id',
    Middlewares.asyncWrapper(utilityAccountManager.update)
  );
  utilityAccountsRouter.delete(
    '/:id',
    Middlewares.asyncWrapper(utilityAccountManager.remove)
  );
  router.use('/utility-accounts', utilityAccountsRouter);

  const propertyTaxStatementsRouter = express.Router();
  propertyTaxStatementsRouter.get(
    '/',
    Middlewares.asyncWrapper(propertyTaxStatementManager.all)
  );
  propertyTaxStatementsRouter.get(
    '/report.csv',
    Middlewares.asyncWrapper(propertyTaxStatementManager.reportCsv)
  );
  propertyTaxStatementsRouter.get(
    '/:id',
    Middlewares.asyncWrapper(propertyTaxStatementManager.one)
  );
  propertyTaxStatementsRouter.get(
    '/:id/attachments/:attachmentId/parse',
    Middlewares.asyncWrapper(
      propertyTaxStatementManager.parseStatementAttachment
    )
  );
  propertyTaxStatementsRouter.post(
    '/parse-upload',
    upload.single('file'),
    Middlewares.asyncWrapper(propertyTaxStatementManager.parseUpload)
  );
  propertyTaxStatementsRouter.post(
    '/',
    Middlewares.asyncWrapper(propertyTaxStatementManager.add)
  );
  propertyTaxStatementsRouter.post(
    '/:id/payment-confirmations',
    Middlewares.asyncWrapper(propertyTaxStatementManager.addPaymentConfirmation)
  );
  propertyTaxStatementsRouter.post(
    '/payment-confirmations/parse-upload',
    upload.single('file'),
    Middlewares.asyncWrapper(
      propertyTaxStatementManager.parsePaymentConfirmationUpload
    )
  );
  propertyTaxStatementsRouter.patch(
    '/:id',
    Middlewares.asyncWrapper(propertyTaxStatementManager.update)
  );
  propertyTaxStatementsRouter.delete(
    '/:id',
    Middlewares.asyncWrapper(propertyTaxStatementManager.remove)
  );
  router.use('/property-tax-statements', propertyTaxStatementsRouter);

  const backupsRouter = express.Router();
  backupsRouter.post(
    '/process',
    Middlewares.asyncWrapper(backupManager.processBackups)
  );
  backupsRouter.post(
    '/attachment/:id',
    Middlewares.asyncWrapper(backupManager.backupOne)
  );
  backupsRouter.get('/stats', Middlewares.asyncWrapper(backupManager.stats));
  router.use('/backups', backupsRouter);

  const dbBackupsRouter = express.Router();
  dbBackupsRouter.get('/', Middlewares.asyncWrapper(dbBackupManager.list));
  dbBackupsRouter.post('/', Middlewares.asyncWrapper(dbBackupManager.create));
  dbBackupsRouter.post(
    '/:name/restore',
    Middlewares.asyncWrapper(dbBackupManager.restore)
  );
  dbBackupsRouter.delete(
    '/:name',
    Middlewares.asyncWrapper(dbBackupManager.remove)
  );
  router.use('/db-backups', dbBackupsRouter);

  const auditLogsRouter = express.Router();
  auditLogsRouter.get('/', Middlewares.asyncWrapper(auditLogManager.all));
  router.use('/audit-logs', auditLogsRouter);

  const apiRouter = express.Router();
  apiRouter.use('/api/v2', router);

  return apiRouter;
}
