import {
  Collections,
  EnvironmentConfig,
  logger,
  MongoClient
} from '@microrealestate/common';
import { fileURLToPath } from 'url';

async function updateThirdPartyConfiguration() {
  const landlords = await Collections.Realm.find({});
  logger.info(`updating Realm ${landlords.length} records`);
  await Promise.all(
    landlords.map(async (landlord) => {
      const hasMailgunApiKey =
        landlord.thirdParties?.mailgun?.apiKey !== undefined;
      const mailgunSelectedUndefined =
        landlord.thirdParties?.mailgun?.selected === undefined;
      const gmailSelectedUndefined =
        landlord.thirdParties?.gmail?.selected === undefined;

      if (
        hasMailgunApiKey &&
        mailgunSelectedUndefined &&
        gmailSelectedUndefined
      ) {
        landlord.thirdParties.gmail.selected = false;
        landlord.thirdParties.mailgun.selected = true;
        return await landlord.save();
      }
      return Promise.resolve();
    })
  );
}

async function cleanupUnusedAttributes() {
  const landlordsCount = await Collections.Realm.countDocuments({});
  logger.info(`cleaning up Realm ${landlordsCount} records`);
  await Collections.Realm.updateMany(
    {},
    {
      $unset: {
        administrator: '',
        bank: '',
        capital: '',
        city: '',
        company: '',
        contact: '',
        email: '',
        legalForm: '',
        manager: '',
        phone1: '',
        phone2: '',
        rcs: '',
        renter: '',
        realmId: '',
        realmName: '',
        rib: '',
        siret: '',
        street1: '',
        street2: '',
        vatNumber: '',
        zipCode: '',
        user1: '',
        user2: '',
        user3: '',
        user4: '',
        user5: '',
        user6: '',
        user7: '',
        user8: '',
        user9: '',
        user10: ''
      }
    }
  );

  const leases = await Collections.Lease.find({});
  logger.info(`cleaning up Lease ${leases.length} records`);
  await Promise.all(
    leases.map(async (lease) => {
      lease.set('templateIds', undefined, { strict: false });
      lease.set('system', undefined, { strict: false });
      lease.set('realmName', undefined, { strict: false });

      return await lease.save();
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
      return await property.save();
    })
  );

  const templates = await Collections.Template.find({});
  logger.info(`cleaning up Template ${templates.length} records`);
  await Promise.all(
    templates.map(async (template) => {
      template.set('organizationId', undefined, { strict: false });
      return await template.save();
    })
  );
}

/**
 * Ensure MongoDB indexes exist for the new LeaseInstance collection.
 * Safe to run multiple times (createIndexes is idempotent).
 */
async function ensureLeaseInstanceIndexes() {
  logger.info('Ensuring LeaseInstance indexes...');
  // Collections.LeaseInstance might not exist if the model hasn't been registered yet
  // (e.g., running migration before the service boots). Guard gracefully.
  if (!Collections.LeaseInstance) {
    logger.warn('LeaseInstance collection not found, skipping index creation');
    return;
  }
  await Collections.LeaseInstance.createIndexes();
  logger.info('LeaseInstance indexes ensured');
}

export default async function migratedb() {
  let failure = false;
  let db;
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
    await cleanupUnusedAttributes();
    await updateThirdPartyConfiguration();
    await ensureLeaseInstanceIndexes();
    logger.info('Migration done');
  } catch (error) {
    logger.error(String(error));
    failure = true;
  } finally {
    if (isRunningAsScript()) {
      // disconnect db and exit process when running as a script
      if (db) {
        try {
          await db.disconnect();
        } catch (error) {
          logger.error(String(error));
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
