const logger = require('winston');
const mongoosedb = require('@microrealestate/common/models/db');
const Realm = require('@microrealestate/common/models/realm');
const Lease = require('@microrealestate/common/models/lease');
const Property = require('@microrealestate/common/models/property');
const Template = require('@microrealestate/common/models/template');
// const Tenant = require('@microrealestate/common/models/tenant');
// const NewTenant = require('@microrealestate/common/models/newtenant');
// const Document = require('@microrealestate/common/models/document');
// const Contract = require('@microrealestate/common/models/contract');

async function withDB(job) {
  let failure = false;
  try {
    await mongoosedb.connect();
    await job();
  } catch (error) {
    logger.error(error);
    failure = true;
  } finally {
    try {
      await mongoosedb.disconnect();
    } catch (error) {
      logger.error(error);
    }
  }
  return failure;
}

async function updateThirdPartyConfiguration() {
  const landlords = await Realm.find();
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
  const landlords = await Realm.find();
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

  const leases = await Lease.find();
  await Promise.all(
    leases.map(async (lease) => {
      lease.set('templateIds', undefined, { strict: false });
      lease.set('system', undefined, { strict: false });
      lease.set('realmName', undefined, { strict: false });

      return await lease.save();
    })
  );

  const properties = await Property.find();
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

  const templates = await Template.find();
  await Promise.all(
    templates.map(async (template) => {
      template.set('organizationId', undefined, { strict: false });
      return await template.save();
    })
  );
}

// async function migrateOccupantToTenant() {
//   const occupants = await Tenant.find();

//   const occupantMap = {};
//   occupants.forEach((occupant) => {
//     const name = `${occupant.realmId}_${occupant.name.trim()}`;
//     if (!occupantMap[name]) {
//       occupantMap[name] = [occupant];
//     } else if (occupantMap[name]) {
//       occupantMap[name].push(occupant);
//     }
//     if (occupantMap[name].length > 1) {
//       occupantMap[name] = occupantMap[name].sort((o1, o2) => {
//         if (o1.beginDate > o2.beginDate) {
//           return -1;
//         } else if (o1.beginDate < o2.beginDate) {
//           return 1;
//         }
//         return 0;
//       });
//     }
//   });

//   await Promise.all(
//     Object.values(occupantMap).map(async (groupedOccupants) => {
//       const contracts = await Promise.all(
//         groupedOccupants.map(async (occupant) => {
//           const documents = await Document.find({
//             realmId: occupant.realmId,
//             tenantId: occupant._id,
//           });

//           return await Contract.create({
//             realmId: occupant.realmId,
//             tenantName: occupant.name,
//             lease: occupant.leaseId,
//             beginDate: occupant.beginDate,
//             endDate: occupant.endDate,
//             terminationDate: occupant.terminationDate,
//             securityDeposit: {
//               payments: [
//                 {
//                   amount: occupant.guaranty ?? 0,
//                 },
//               ],
//               refunds:
//                 occupant.guarantyPayback >= 0
//                   ? [
//                       {
//                         amount: occupant.guarantyPayback,
//                       },
//                     ]
//                   : undefined,
//             },
//             properties: occupant.properties.map((property) => ({
//               property: property.propertyId,
//               rent: property.rent,
//               expenses: property.expenses,
//               entryDate: property.entryDate,
//               exitDate: property.exitDate,
//             })),
//             billingInfo: {
//               reference: occupant.reference,
//               isVat: occupant.isVat,
//               vatRatio: occupant.vatRatio,
//               discount: occupant.discount,
//             },
//             documents: documents.map((doc) => String(doc._id)),
//             rents: occupant.rents,
//             stepperMode: occupant.stepperMode,
//           });
//         })
//       );

//       const occupant = groupedOccupants[0];
//       return await NewTenant.create({
//         realmId: occupant.realmId,
//         name: occupant.name,
//         isCompany: occupant.isCompany,
//         companyInfo: occupant.isCompany
//           ? {
//               name: occupant.name,
//               legalStructure: occupant.legalForm,
//               legalRepresentative: occupant.manager,
//               capital: occupant.capital,
//               ein: occupant.siret,
//               dos: occupant.rcs,
//             }
//           : undefined,
//         addresses: [
//           {
//             street1: occupant.street1,
//             street2: occupant.street2,
//             zipCode: occupant.zipCode,
//             city: occupant.city,
//           },
//         ],
//         contacts: occupant.contacts.map((contact) => ({
//           name: contact.contact,
//           email: contact.email,
//           phone1: contact.phone,
//         })),
//         contracts: contracts.map((c) => String(c._id)),
//       });
//     })
//   );
// }

// Main
async function Main(processExitOnCompleted = false) {
  let failure = false;
  try {
    failure = await withDB(async () => {
      await cleanupUnusedAttributes();
      await updateThirdPartyConfiguration();

      //await migrateOccupantToTenant();
    });
  } catch (error) {
    logger.error(error);
    failure = true;
  } finally {
    if (processExitOnCompleted) {
      process.exit(failure ? 1 : 0);
    }
  }
}

// run this block if script is executed not imported
if (require.main === module) {
  Main(true);
}

module.exports = Main;
