import { fileURLToPath } from 'node:url';
import {
  Collections,
  DateFormat,
  EnvironmentConfig,
  formatError,
  logger,
  MongoClient
} from '@microrealestate/common';
import moment from 'moment';
import mongoose from 'mongoose';

type FieldPath = string[];

const COLLECTION_DATE_FIELDS: Record<string, FieldPath[]> = {
  occupants: [
    ['beginDate'],
    ['endDate'],
    ['terminationDate'],
    ['lastRenewedAt'],
    ['properties', '*', 'entryDate'],
    ['properties', '*', 'exitDate'],
    ['properties', '*', 'expenses', '*', 'beginDate'],
    ['properties', '*', 'expenses', '*', 'endDate'],
    ['rents', '*', 'payments', '*', 'date']
  ],
  documents: [['expiryDate'], ['createdDate'], ['updatedDate']],
  emails: [['sentDate']],
  accounts: [['createdDate']]
};

function normalizeValue(
  value: unknown,
  allowLegacyDDMMYYYY: boolean
): {
  changed: boolean;
  value: string | undefined;
} {
  if (value === undefined || value === null || value === '') {
    return { changed: false, value: undefined };
  }
  if (typeof value === 'string' && DateFormat.DATE_FORMAT_REGEX.test(value)) {
    return { changed: false, value };
  }
  if (value instanceof Date) {
    const formatted = moment(value).format(DateFormat.DATE_FORMAT);
    return { changed: true, value: formatted };
  }
  if (typeof value === 'string') {
    if (allowLegacyDDMMYYYY) {
      const legacy = moment(
        value,
        ['DD/MM/YYYY', 'D/M/YYYY', 'D/MM/YYYY', 'DD/M/YYYY'],
        true
      );
      if (legacy.isValid()) {
        return { changed: true, value: legacy.format(DateFormat.DATE_FORMAT) };
      }
    }
    const m = moment(value);
    if (m.isValid()) {
      return { changed: true, value: m.format(DateFormat.DATE_FORMAT) };
    }
  }
  return { changed: true, value: undefined };
}

function walkAndNormalize(
  doc: Record<string, unknown> | unknown[],
  path: FieldPath,
  pathIndex: number,
  allowLegacyDDMMYYYY: boolean,
  state: { changed: boolean }
): void {
  if (pathIndex >= path.length) return;
  const segment = path[pathIndex];
  if (segment === '*') {
    if (!Array.isArray(doc)) return;
    for (const item of doc) {
      if (item && typeof item === 'object') {
        walkAndNormalize(
          item as Record<string, unknown>,
          path,
          pathIndex + 1,
          allowLegacyDDMMYYYY,
          state
        );
      }
    }
    return;
  }
  if (Array.isArray(doc)) return;
  if (pathIndex === path.length - 1) {
    const current = (doc as Record<string, unknown>)[segment as string];
    const { changed, value } = normalizeValue(current, allowLegacyDDMMYYYY);
    if (changed) {
      if (value === undefined) {
        delete (doc as Record<string, unknown>)[segment as string];
      } else {
        (doc as Record<string, unknown>)[segment as string] = value;
      }
      state.changed = true;
    }
    return;
  }
  const next = (doc as Record<string, unknown>)[segment as string];
  if (next && typeof next === 'object') {
    walkAndNormalize(
      next as Record<string, unknown>,
      path,
      pathIndex + 1,
      allowLegacyDDMMYYYY,
      state
    );
  }
}

async function migrateDateFields() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('mongoose connection is not ready');
  }
  for (const [collectionName, paths] of Object.entries(
    COLLECTION_DATE_FIELDS
  )) {
    const collection = db.collection(collectionName);
    const cursor = collection.find({});
    let total = 0;
    let migrated = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc) continue;
      total++;
      const state = { changed: false };
      for (const path of paths) {
        const allowLegacyDDMMYYYY =
          collectionName === 'occupants' && path[path.length - 1] === 'date';
        walkAndNormalize(
          doc as Record<string, unknown>,
          path,
          0,
          allowLegacyDDMMYYYY,
          state
        );
      }
      if (state.changed) {
        await collection.replaceOne({ _id: doc._id }, doc);
        migrated++;
      }
    }
    logger.info(`migrated ${migrated}/${total} ${collectionName} docs`);
  }
}

async function cleanupUnusedAttributes() {
  const landlords = await Collections.Realm.find({});
  logger.info(`cleaning up Realm ${landlords.length} records`);
  await Promise.all(
    landlords.map(async (landlord) => {
      landlord.set('administrator', undefined, { strict: false });
      landlord.set('bank', undefined, { strict: false });
      landlord.set('capital', undefined, { strict: false });
      landlord.set('city', undefined, { strict: false });
      landlord.set('company', undefined, { strict: false });
      landlord.set('contact', undefined, { strict: false });
      landlord.set('email', undefined, { strict: false });
      landlord.set('legalForm', undefined, { strict: false });
      landlord.set('manager', undefined, { strict: false });
      landlord.set('phone1', undefined, { strict: false });
      landlord.set('phone2', undefined, { strict: false });
      landlord.set('rcs', undefined, { strict: false });
      landlord.set('renter', undefined, { strict: false });

      landlord.set('realmId', undefined, { strict: false });
      landlord.set('realmName', undefined, { strict: false });
      landlord.set('rib', undefined, { strict: false });
      landlord.set('siret', undefined, { strict: false });
      landlord.set('street1', undefined, { strict: false });
      landlord.set('street2', undefined, { strict: false });
      landlord.set('vatNumber', undefined, { strict: false });
      landlord.set('zipCode', undefined, { strict: false });

      landlord.set('user1', undefined, { strict: false });
      landlord.set('user1', undefined, { strict: false });
      landlord.set('user2', undefined, { strict: false });
      landlord.set('user3', undefined, { strict: false });
      landlord.set('user4', undefined, { strict: false });
      landlord.set('user5', undefined, { strict: false });
      landlord.set('user6', undefined, { strict: false });
      landlord.set('user7', undefined, { strict: false });
      landlord.set('user8', undefined, { strict: false });
      landlord.set('user9', undefined, { strict: false });
      landlord.set('user10', undefined, { strict: false });
      return await landlord.save({ validateBeforeSave: false });
    })
  );

  const leases = await Collections.Lease.find({});
  logger.info(`cleaning up Lease ${leases.length} records`);
  await Promise.all(
    leases.map(async (lease) => {
      lease.set('templateIds', undefined, { strict: false });
      lease.set('system', undefined, { strict: false });
      lease.set('realmName', undefined, { strict: false });

      return await lease.save({ validateBeforeSave: false });
    })
  );

  const properties = await Collections.Property.find({});
  logger.info(`cleaning up Property ${properties.length} records`);
  await Promise.all(
    properties.map(async (property) => {
      property.set('expense', undefined, { strict: false });
      property.set('location', undefined, { strict: false });
      property.set('building', undefined, { strict: false });
      property.set('level', undefined, { strict: false });
      property.set('available', undefined, { strict: false });
      property.set('beginDate', undefined, { strict: false });
      property.set('endDate', undefined, { strict: false });
      property.set('lastBusyDay', undefined, { strict: false });
      property.set('m2Expense', undefined, { strict: false });
      property.set('m2Price', undefined, { strict: false });
      property.set('occupant', undefined, { strict: false });
      property.set('occupantLabel', undefined, { strict: false });
      property.set('priceWithExpenses', undefined, { strict: false });
      if (property.price) {
        property.set('price', Math.round(property.price * 100) / 100);
      }
      return await property.save({ validateBeforeSave: false });
    })
  );

  const templates = await Collections.Template.find({});
  logger.info(`cleaning up Template ${templates.length} records`);
  await Promise.all(
    templates.map(async (template) => {
      template.set('organizationId', undefined, { strict: false });
      return await template.save({ validateBeforeSave: false });
    })
  );
}

async function updateDocuments() {
  const documents = await Collections.Document.find({}).setOptions({
    includeDeleted: true
  });
  logger.info(`updating Document ${documents.length} records`);
  await Promise.all(
    documents.map(async (document) => {
      const tenantId = document.get('tenantId');
      const leaseId = document.get('leaseId');
      const templateId = document.get('templateId');

      if (!(tenantId || leaseId || templateId)) {
        return Promise.resolve();
      }

      const relatesTo: Record<string, unknown> = {
        tenants: [] as string[],
        leases: [] as string[]
      };

      relatesTo.template = templateId;
      (relatesTo.tenants as string[]).push(tenantId);
      (relatesTo.leases as string[]).push(leaseId);

      document.set('tenantId', undefined, { strict: false });
      document.set('leaseId', undefined, { strict: false });
      document.set('templateId', undefined, { strict: false });
      document.set('relatesTo', relatesTo);

      if (document.url) {
        const folder = `/${document.url.split('/').slice(1, -1).join('/')}`;
        document.set('folder', folder);
      }

      return await document.save({ validateBeforeSave: false });
    })
  );
}

async function updateTemplates() {
  const templates = await Collections.Template.find({});
  logger.info(`updating Template ${templates.length} records`);
  await Promise.all(
    templates.map(async (template) => {
      const linkedResourceIds = template.get('linkedResourceIds');
      if (!linkedResourceIds && template.realmId) {
        return Promise.resolve();
      }

      template.set('realmId', template.get('realmId') || 'none');
      template.set('relatesTo', linkedResourceIds);
      template.set('linkedResourceIds', undefined, { strict: false });

      return await template.save({ validateBeforeSave: false });
    })
  );
}

async function migrateRealmBankInfo() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('mongoose connection is not ready');
  }
  const collection = db.collection('realms');
  const cursor = collection.find({});
  let total = 0;
  let migrated = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) continue;
    total++;
    const current = doc.bankInfo;
    if (!Array.isArray(current)) continue;
    const first = current[0] as { name?: string; iban?: string } | undefined;
    doc.bankInfo = { name: first?.name ?? '', iban: first?.iban ?? '' };
    await collection.replaceOne({ _id: doc._id }, doc);
    migrated++;
  }
  logger.info(`migrated bankInfo ${migrated}/${total} realms`);
}

async function migrateMembersToSlots() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('mongoose connection is not ready');
  }
  const collection = db.collection('realms');
  const cursor = collection.find({});
  let total = 0;
  let migrated = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) continue;
    total++;
    // already migrated
    if (doc.member1) continue;
    const members = doc.members;
    if (!Array.isArray(members) || !members.length) continue;

    // administrators first, they are the ones who kept their access
    const sorted = [...members].sort((m1, m2) => {
      const admin1 = m1?.role === 'administrator' ? 0 : 1;
      const admin2 = m2?.role === 'administrator' ? 0 : 1;
      return admin1 - admin2;
    });
    const toSlot = (member: Record<string, unknown> | undefined) =>
      member?.email
        ? {
            name: member.name ?? '',
            email: member.email
          }
        : null;

    const member1 = toSlot(sorted[0]);
    if (!member1) continue;

    await collection.updateOne(
      { _id: doc._id },
      { $set: { member1, member2: toSlot(sorted[1]) } }
    );
    migrated++;
  }
  logger.info(`migrated members ${migrated}/${total} realms`);
}

async function migrateThirdPartiesEmailService() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('mongoose connection is not ready');
  }
  const collection = db.collection('realms');
  const cursor = collection.find({
    $or: [
      { 'thirdParties.gmail': { $exists: true } },
      { 'thirdParties.smtp.selected': { $exists: true } },
      { 'thirdParties.smtp.secure': { $exists: true } }
    ]
  });
  let total = 0;
  let migrated = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) continue;
    total++;
    const tp = doc.thirdParties;
    if (!tp || typeof tp !== 'object') continue;
    const gmail = (tp as { gmail?: Record<string, unknown> }).gmail;
    const smtp = (tp as { smtp?: Record<string, unknown> }).smtp;
    if (gmail?.selected) {
      (tp as { smtp?: unknown }).smtp = {
        server: 'smtp.gmail.com',
        port: 587,
        encryption: 'starttls',
        authentication: true,
        username: gmail.email,
        password: gmail.appPassword, // ciphertext, moved as-is
        fromEmail: gmail.fromEmail,
        replyToEmail: gmail.replyToEmail
      };
    } else if (smtp?.selected === false) {
      // Dropped, not just unflagged: a server is what activates the config now, so the
      // leftover fields would silently turn on a config that was never in use.
      (tp as { smtp?: unknown }).smtp = null;
    } else if (smtp) {
      delete smtp.selected;
      if ('secure' in smtp) {
        smtp.encryption = smtp.secure ? 'tls' : 'starttls';
        delete smtp.secure;
      }
    }
    delete (tp as { gmail?: unknown }).gmail;
    await collection.replaceOne({ _id: doc._id }, doc);
    migrated++;
  }
  logger.info(`migrated email service config ${migrated}/${total} realms`);
}

async function migrateTenantContacts() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('mongoose connection is not ready');
  }
  const collection = db.collection('occupants');
  const cursor = collection.find({});
  let total = 0;
  let migrated = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) continue;
    total++;
    let needsUpdate = false;
    if (Array.isArray(doc.contacts)) {
      for (const contact of doc.contacts) {
        if (contact.contact !== undefined) {
          contact.name = contact.contact;
          delete contact.contact;
          needsUpdate = true;
        }
        if (contact.phone !== undefined) {
          contact.phone1 = contact.phone;
          delete contact.phone;
          needsUpdate = true;
        }
      }
    }
    if (needsUpdate) {
      await collection.replaceOne({ _id: doc._id }, doc);
      migrated++;
    }
  }
  logger.info(`migrated tenant contacts ${migrated}/${total} docs`);
}

async function migrateSecurityDeposit() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('mongoose connection is not ready');
  }
  const collection = db.collection('occupants');
  const cursor = collection.find({
    $or: [
      { guaranty: { $exists: true } },
      { guarantyPayback: { $exists: true } }
    ]
  });
  let total = 0;
  let migrated = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) continue;
    total++;
    if (
      Array.isArray(doc.securityDeposit) ||
      Array.isArray(doc.securityDepositRefund)
    ) {
      await collection.updateOne(
        { _id: doc._id },
        { $unset: { guaranty: '', guarantyPayback: '' } }
      );
      migrated++;
      continue;
    }
    const guaranty = typeof doc.guaranty === 'number' ? doc.guaranty : 0;
    const guarantyPayback =
      typeof doc.guarantyPayback === 'number' ? doc.guarantyPayback : 0;
    const refundDate = doc.terminationDate ?? doc.endDate;
    const set: Record<string, unknown> = {
      securityDeposit:
        guaranty > 0
          ? [
              {
                amount: guaranty,
                date: doc.beginDate,
                paymentType: 'other'
              }
            ]
          : [],
      securityDepositRefund:
        guarantyPayback > 0 && refundDate
          ? [
              {
                amount: guarantyPayback,
                date: refundDate,
                paymentType: 'other'
              }
            ]
          : []
    };
    if (typeof doc.guaranty === 'number') {
      set.expectedSecurityDeposit = doc.guaranty;
    }
    await collection.updateOne(
      { _id: doc._id },
      { $set: set, $unset: { guaranty: '', guarantyPayback: '' } }
    );
    migrated++;
  }
  logger.info(`migrated security deposit ${migrated}/${total} docs`);
}

async function migratePaymentMethods() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('mongoose connection is not ready');
  }
  const collection = db.collection('occupants');
  const cursor = collection.find({
    'rents.payments.type': { $in: ['check', 'credit-card', 'levy'] }
  });
  let total = 0;
  let migrated = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) continue;
    total++;
    let needsUpdate = false;
    if (Array.isArray(doc.rents)) {
      for (const rent of doc.rents) {
        if (Array.isArray(rent.payments)) {
          for (const payment of rent.payments) {
            if (payment.type === 'check') {
              payment.type = 'cheque';
              needsUpdate = true;
            } else if (payment.type === 'credit-card') {
              payment.type = 'card';
              needsUpdate = true;
            } else if (payment.type === 'levy') {
              payment.type = 'direct_debit';
              needsUpdate = true;
            }
          }
        }
      }
    }
    if (needsUpdate) {
      await collection.replaceOne({ _id: doc._id }, doc);
      migrated++;
    }
  }
  logger.info(`migrated payment methods ${migrated}/${total} docs`);
}

async function migrateEmailTemplateNames() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('mongoose connection is not ready');
  }
  const collection = db.collection('emails');
  const renames: [string, string][] = [
    ['rentcall', 'rentnotice'],
    ['rentcall_reminder', 'rentnotice_reminder'],
    ['rentcall_last_reminder', 'rentnotice_last_reminder'],
    ['invoice', 'receipt']
  ];
  let migrated = 0;
  for (const [from, to] of renames) {
    const result = await collection.updateMany(
      { templateName: from },
      { $set: { templateName: to } }
    );
    migrated += result.modifiedCount;
  }
  logger.info(
    `migrated ${migrated} email templateName (rentcall->rentnotice, invoice->receipt)`
  );
}

async function migrateAutoRenew() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('mongoose connection is not ready');
  }
  const result = await db
    .collection('leases')
    .updateMany(
      { autoRenew: { $exists: false } },
      { $set: { autoRenew: false } }
    );
  logger.info(`migrated ${result.modifiedCount} leases with autoRenew=false`);
}

export default async function migratedb() {
  let failure = false;
  let db: MongoClient | undefined;
  try {
    // init db connection when running as a script
    // otherwise the connection is managed by the service
    if (isRunningAsScript()) {
      logger.info('Connecting to database...');
      db = MongoClient.getInstance(new EnvironmentConfig());
      await db.connect();
      logger.info('Database connected');
    }

    logger.info('Starting migration...');
    await migrateRealmBankInfo();
    await migrateMembersToSlots();
    await cleanupUnusedAttributes();
    await migrateDateFields();
    await migratePaymentMethods();
    await migrateSecurityDeposit();
    await updateDocuments();
    await updateTemplates();
    await migrateThirdPartiesEmailService();
    await migrateTenantContacts();
    await migrateEmailTemplateNames();
    await migrateAutoRenew();
    logger.info('Migration done');
  } catch (error) {
    logger.error(formatError(error));
    failure = true;
  } finally {
    if (isRunningAsScript()) {
      // disconnect db and exit process when running as a script
      if (db) {
        try {
          await db.disconnect();
        } catch (error) {
          logger.error(formatError(error));
          failure = true;
        }
      }
      process.exit(failure ? 1 : 0);
    }
  }
}

const __filename = fileURLToPath(import.meta.url);
function isRunningAsScript() {
  return __filename === process.argv[1];
}

// run this block only when running as a script
if (isRunningAsScript()) {
  migratedb();
}
