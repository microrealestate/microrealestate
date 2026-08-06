import * as accountingManager from './managers/accountingmanager.js';
import * as attachmentManager from './managers/attachmentmanager.js';
import * as auditLogManager from './managers/auditlogmanager.js';
import * as backupManager from './managers/backupmanager.js';
import * as contractorManager from './managers/contractormanager.js';
import * as dashboardManager from './managers/dashboardmanager.js';
import * as dbBackupManager from './managers/dbbackupmanager.js';
import * as emailManager from './managers/emailmanager.js';
import * as leaseInstanceManager from './managers/leaseinstancemanager.js';
import * as leaseManager from './managers/leasemanager.js';
import * as notesManager from './managers/notesmanager.js';
import * as occupantManager from './managers/occupantmanager.js';
import * as projectManager from './managers/projectmanager.js';
import * as propertyManager from './managers/propertymanager.js';
import * as propertyTaxStatementManager from './managers/propertytaxstatementmanager.js';
import * as realmManager from './managers/realmmanager.js';
import * as rentManager from './managers/rentmanager.js';
import * as reportsManager from './managers/reportsmanager.js';
import * as utilityAccountManager from './managers/utilityaccountmanager.js';
import * as utilityInvoiceManager from './managers/utilityinvoicemanager.js';
import * as utilityManager from './managers/utilitymanager.js';
import { Middlewares, Service } from '@microrealestate/common';
import express from 'express';
import { upload } from './utils/upload.js';

export default function routes() {
  const { ACCESS_TOKEN_SECRET } = Service.getInstance().envConfig.getValues();
  const router = express.Router();
  // Unprotected — token carries auth; must be before needAccessToken middleware
  router.get(
    '/attachments/:id/view',
    Middlewares.asyncWrapper(attachmentManager.viewWithToken)
  );

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

  // ── Lease Instance routes (document-centric lifecycle: draft → active → expired) ──
  const leaseInstanceRouter = express.Router();
  // List / create
  leaseInstanceRouter.get('/', Middlewares.asyncWrapper(leaseInstanceManager.all));
  leaseInstanceRouter.post('/', Middlewares.asyncWrapper(leaseInstanceManager.create));
  // Reconcile expired (utility / scheduled-job endpoint)
  leaseInstanceRouter.post('/reconcile-expired', Middlewares.asyncWrapper(leaseInstanceManager.reconcileExpired));
  // Convenience lookups
  leaseInstanceRouter.get('/by-tenant/:tenantId', Middlewares.asyncWrapper(leaseInstanceManager.byTenant));
  leaseInstanceRouter.get('/by-property/:propertyId', Middlewares.asyncWrapper(leaseInstanceManager.byProperty));
  // Single instance CRUD
  leaseInstanceRouter.get('/:id', Middlewares.asyncWrapper(leaseInstanceManager.one));
  leaseInstanceRouter.patch('/:id', Middlewares.asyncWrapper(leaseInstanceManager.update));
  leaseInstanceRouter.delete('/:id', Middlewares.asyncWrapper(leaseInstanceManager.remove));
  // Lifecycle transition
  leaseInstanceRouter.post('/:id/activate', Middlewares.asyncWrapper(leaseInstanceManager.activate));
  router.use('/lease-instances', leaseInstanceRouter);

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
  attachmentsRouter.get('/:id/view-token', Middlewares.asyncWrapper(attachmentManager.issueViewToken));
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
  utilitiesRouter.get(
    '/email-connection',
    Middlewares.asyncWrapper(utilityManager.getEmailConnection)
  );
  utilitiesRouter.put(
    '/email-connection',
    Middlewares.asyncWrapper(utilityManager.upsertEmailConnection)
  );
  utilitiesRouter.post(
    '/email-connection/test',
    Middlewares.asyncWrapper(utilityManager.testEmailConnection)
  );
  utilitiesRouter.post(
    '/import-email-confirmations',
    Middlewares.asyncWrapper(utilityManager.importEmailConfirmations)
  );
  utilitiesRouter.post(
    '/:id/approve-pending',
    Middlewares.asyncWrapper(utilityManager.approvePendingConfirmation)
  );
  utilitiesRouter.delete(
    '/:id/reject-pending',
    Middlewares.asyncWrapper(utilityManager.rejectPendingConfirmation)
  );
  utilitiesRouter.post(
    '/parse-upload',
    upload.single('file'),
    Middlewares.asyncWrapper(utilityManager.parseUpload)
  );
  utilitiesRouter.post(
    '/recapture-all-from-email',
    Middlewares.asyncWrapper(utilityManager.recaptureAllEmailBills)
  );
  utilitiesRouter.post(
    '/deduplicate',
    Middlewares.asyncWrapper(utilityManager.deduplicateUtilities)
  );
  utilitiesRouter.post(
    '/backfill-original-amount',
    Middlewares.asyncWrapper(utilityManager.backfillOriginalAmount)
  );
  utilitiesRouter.post(
    '/attach-bill-scan',
    upload.single('file'),
    Middlewares.asyncWrapper(utilityManager.attachBillScan)
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

  const utilityInvoicesRouter = express.Router();
  utilityInvoicesRouter.get(
    '/',
    Middlewares.asyncWrapper(utilityInvoiceManager.listInvoices)
  );
  utilityInvoicesRouter.get(
    '/outstanding-summary',
    Middlewares.asyncWrapper(utilityInvoiceManager.outstandingSummary)
  );
  utilityInvoicesRouter.get(
    '/:id',
    Middlewares.asyncWrapper(utilityInvoiceManager.getInvoice)
  );
  utilityInvoicesRouter.post(
    '/generate',
    Middlewares.asyncWrapper(utilityInvoiceManager.generateInvoices)
  );
  utilityInvoicesRouter.post(
    '/:id/send',
    Middlewares.asyncWrapper(utilityInvoiceManager.sendInvoice)
  );
  utilityInvoicesRouter.put(
    '/:id/pay',
    Middlewares.asyncWrapper(utilityInvoiceManager.markPaid)
  );
  utilityInvoicesRouter.post(
    '/:id/void',
    Middlewares.asyncWrapper(utilityInvoiceManager.voidInvoice)
  );
  router.use('/utility-invoices', utilityInvoicesRouter);

  // QB posting log lives on the utility entry itself
  utilitiesRouter.post(
    '/:id/qb-posted',
    Middlewares.asyncWrapper(utilityInvoiceManager.logQbPosted)
  );
  utilitiesRouter.post(
    '/:id/recapture-bill-from-email',
    Middlewares.asyncWrapper(utilityManager.recaptureEmailBill)
  );

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

  const reportsRouter = express.Router();
  reportsRouter.get(
    '/property-costs',
    Middlewares.asyncWrapper(reportsManager.propertyCosts)
  );
  reportsRouter.get(
    '/property-costs.csv',
    Middlewares.asyncWrapper(reportsManager.propertyCostsCsv)
  );
  reportsRouter.get(
    '/utility-ledger',
    Middlewares.asyncWrapper(reportsManager.utilityLedger)
  );
  reportsRouter.get(
    '/utility-ledger.csv',
    Middlewares.asyncWrapper(reportsManager.utilityLedgerCsv)
  );
  reportsRouter.get(
    '/space-marketing-summary',
    Middlewares.asyncWrapper(reportsManager.spaceMarketingSummary)
  );
  router.use('/reports', reportsRouter);

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
