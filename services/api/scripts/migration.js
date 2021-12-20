const logger = require('winston');
const moment = require('moment');
const mongoosedb = require('@mre/common/models/db');
const Tenant = require('@mre/common/models/tenant');
const Lease = require('@mre/common/models/lease');
const db = require('../src/models/db');
const accountModel = require('../src/models/account');
const realmModel = require('../src/models/realm');
const tenantModel = require('../src/models/occupant');
const tenant = require('@mre/common/models/tenant');

async function _connectDb() {
  await mongoosedb.connect();
  await db.init();
}

const updateRealm = async (realm) => {
  return await new Promise((resolve, reject) => {
    try {
      realmModel.update(realm, (errors, saved) => {
        if (errors) {
          return reject(errors);
        }
        resolve(saved);
      });
    } catch (error) {
      reject(error);
    }
  });
};

const findAllAccounts = () => {
  return new Promise((resolve, reject) => {
    try {
      accountModel.findAll((errors, accounts) => {
        if (errors) {
          return reject(errors);
        }
        resolve(accounts);
      });
    } catch (error) {
      reject(error);
    }
  });
};

const findAllRealms = () => {
  return new Promise((resolve, reject) => {
    try {
      realmModel.findAll((errors, realms) => {
        if (errors) {
          return reject(errors);
        }
        resolve(realms);
      });
    } catch (error) {
      reject(error);
    }
  });
};

const findAllTenants = (realm) => {
  return new Promise((resolve, reject) => {
    try {
      tenantModel.findAll(realm, (errors, tenants) => {
        if (errors) {
          return reject(errors);
        }
        resolve(tenants);
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Main
module.exports = async () => {
  try {
    await _connectDb();

    const realms = (await findAllRealms()) || [];
    const accounts = (await findAllAccounts()) || [];
    const accountMap = accounts.reduce(
      (acc, { email, firstname, lastname }) => {
        acc[email] = `${firstname} ${lastname}`;
        return acc;
      },
      { '': '' }
    );
    const updatedRealms = await Promise.all(
      realms.map(async (realm) => {
        const updatedRealm = {
          _id: realm._id,
          name: realm.name,
          members:
            realm.members ||
            [
              {
                name: accountMap[realm.administrator],
                registered: true,
                email: realm.administrator,
                role: 'administrator',
              },
              {
                name: accountMap[realm.user1 || ''],
                registered: true,
                email: realm.user1,
                role: 'renter',
              },
              {
                name: accountMap[realm.user2 || ''],
                registered: true,
                email: realm.user2,
                role: 'renter',
              },
              {
                name: accountMap[realm.user3 || ''],
                registered: true,
                email: realm.user3,
                role: 'renter',
              },
              {
                name: accountMap[realm.user4 || ''],
                registered: true,
                email: realm.user4,
                role: 'renter',
              },
              {
                name: accountMap[realm.user5 || ''],
                registered: true,
                email: realm.user5,
                role: 'renter',
              },
              {
                name: accountMap[realm.user6 || ''],
                registered: true,
                email: realm.user6,
                role: 'renter',
              },
              {
                name: accountMap[realm.user7 || ''],
                registered: true,
                email: realm.user7,
                role: 'renter',
              },
              {
                name: accountMap[realm.user8 || ''],
                registered: true,
                email: realm.user8,
                role: 'renter',
              },
              {
                name: accountMap[realm.user9 || ''],
                registered: true,
                email: realm.user9,
                role: 'renter',
              },
              {
                name: accountMap[realm.user10 || ''],
                registered: true,
                email: realm.user10,
                role: 'renter',
              },
            ].filter((member) => !!member.email), // [{ email, role },]
          isCompany: realm.isCompany,
          locale: realm.locale || 'en',
          currency: realm.currency || 'EUR',
        };
        if (
          realm.addresses ||
          realm.street1 ||
          realm.street2 ||
          realm.zipCode ||
          realm.city
        ) {
          updatedRealm.addresses = realm.addresses || [
            {
              street1: realm.street1 || '',
              street2: realm.street2 || '',
              zipCode: realm.zipCode || '',
              city: realm.city || '',
              state: realm.state || '',
              country: realm.country || '',
            },
          ]; // [{ street1, street2, zipCode, city, state, country }, ]
        }
        if (
          realm.contacts ||
          realm.contact ||
          realm.email ||
          realm.phone1 ||
          realm.phone2
        ) {
          updatedRealm.contacts = realm.contacts || [
            {
              name: realm.contact || '',
              email: realm.email || '',
              phone1: realm.phone1 || '',
              phone2: realm.phone2 || '',
            },
          ]; // [{ name, email, phone1, phone2 }]
        }
        if (realm.bankInfo || realm.bank) {
          updatedRealm.bankInfo = realm.bankInfo || {
            name: realm.bank,
            iban: realm.rib || '',
          }; // { name, iban }
        }
        if (realm.isCompany) {
          updatedRealm.companyInfo = realm.companyInfo || {
            name: realm.company || '',
            legalStructure: realm.legalForm || '',
            capital: realm.capital || '',
            ein: realm.siret || '',
            dos: realm.rcs || '',
            vatNumber: realm.vatNumber || '',
            legalRepresentative: realm.manager || '',
          };
        }

        let dbCustomLease;
        let dbFrench369Lease;
        const leases = await Lease.find({
          realmId: realm._id,
        });
        const customLease = {
          realmId: realm._id,
          name: 'custom',
          description: 'Monthly rents without time limit',
          timeRange: 'months',
          active: true,
          system: true,
        };
        const french369Lease = {
          realmId: realm._id,
          name: '369',
          description: 'French business lease limited to 9 years',
          numberOfTerms: 108,
          timeRange: 'months',
          active: true,
          system: false,
        };
        if (!leases || !leases.length) {
          const results = await Lease.insertMany([customLease, french369Lease]);
          dbCustomLease = results[0];
          dbFrench369Lease = results[1];
        } else {
          dbCustomLease = leases.find(({ system }) => system === true);
          dbFrench369Lease = leases.find(
            ({ numberOfTerms }) => numberOfTerms === 108
          );

          if (dbCustomLease) {
            dbCustomLease = {
              ...dbCustomLease.toObject(),
              ...customLease,
            };
            dbCustomLease = await Lease.replaceOne(
              { _id: dbCustomLease._id },
              dbCustomLease
            );
          }

          if (dbFrench369Lease) {
            dbFrench369Lease = {
              ...dbFrench369Lease.toObject(),
              ...french369Lease,
            };

            await Lease.replaceOne(
              { _id: dbFrench369Lease._id },
              dbFrench369Lease
            );
          }
        }

        const tenants = (await findAllTenants(realm)) || [];
        await Promise.all(
          tenants.map(async (dbTenant) => {
            let beginDate = dbTenant.beginDate;
            let endDate = dbTenant.endDate;
            let terminationDate = dbTenant.terminationDate || null;

            if (typeof tenant.beginDate === 'string') {
              beginDate = moment(tenant.beginDate, 'DD/MM/YYYY').toDate();
            }

            if (typeof tenant.endDate === 'string') {
              endDate = moment(tenant.endDate, 'DD/MM/YYYY').toDate();
            }

            if (
              tenant.terminationDate &&
              typeof tenant.terminationDate === 'string'
            ) {
              terminationDate = moment(
                tenant.terminationDate,
                'DD/MM/YYYY'
              ).toDate();
            }

            // add the leaseId property to tenant (occupant)
            let leaseId = dbTenant.leaseId;
            if (dbCustomLease && dbFrench369Lease) {
              leaseId = String(dbCustomLease._id);
              if (dbTenant.contract === '369') {
                leaseId = String(dbFrench369Lease._id);
              }
            }

            // update the properties to add the rent and expenses of properties
            let properties = dbTenant.properties || [];
            properties.forEach((property) => {
              if (!property.expenses) {
                property.rent = property.property.price;
                property.expenses = [];

                if (property.property.expense) {
                  property.expenses = [
                    {
                      title: 'general expense',
                      amount: property.property.expense,
                    },
                  ];
                }
              }

              property.entryDate =
                (property.entryDate &&
                  moment(property.entryDate, 'DD/MM/YYYY').toDate()) ||
                undefined;

              property.exitDate =
                (property.exitDate &&
                  moment(property.exitDate, 'DD/MM/YYYY').toDate()) ||
                undefined;
            });

            await Tenant.replaceOne(
              { _id: dbTenant._id },
              {
                ...dbTenant,
                realmId: realm._id,
                beginDate,
                endDate,
                terminationDate,
                leaseId,
                properties,
              }
            );
          })
        );
        return updatedRealm;
      })
    );

    await Promise.all(
      updatedRealms.map((updatedRealm) => updateRealm(updatedRealm))
    );
  } catch (error) {
    logger.error(error);
  }
};
