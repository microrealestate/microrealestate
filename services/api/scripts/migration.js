import {
  Collections,
  EnvironmentConfig,
  MongoClient
} from '@microrealestate/common';
import { fileURLToPath } from 'url';
import logger from 'winston';

async function updateThirdPartyConfiguration() {
  const landlords = await Collections.Realm.find({});
  logger.info(`updating Realm ${landlords.length} records`);
  await Promise.all(
    landlords.map(async (landlord) => {
      if (
        landlord.thirdParties.mailgun.apiKey !== undefined &&
        landlord.thirdParties.mailgun.selected === undefined &&
        landlord.thirdParties.gmail.selected === undefined
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
      return await landlord.save();
    })
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
      property.set('price', Math.round(property.price * 100) / 100);
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
    logger.info('Migration done');
  } catch (error) {
    logger.error(error);
    failure = true;
  } finally {
    if (isRunningAsScript()) {
      // disconnect db and exit process when running as a script
      if (db) {
        try {
          await db.disconnect();
        } catch (error) {
          logger.error(error);
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
