const db = require('../src/models/db');
const accountModel = require('../src/models/account');
const realmModel = require('../src/models/realm');
const tenantModel = require('../src/models/occupant');
const leaseModel = require('../src/models/lease');

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

const addLease = async (realm, lease) => {
  return await new Promise((resolve, reject) => {
    try {
      leaseModel.add(realm, lease, (errors, saved) => {
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

const updateLease = async (realm, lease) => {
  return await new Promise((resolve, reject) => {
    try {
      leaseModel.update(realm, lease, (errors, saved) => {
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

const updateTenant = async (realm, tenant) => {
  return await new Promise((resolve, reject) => {
    try {
      tenantModel.update(realm, tenant, (errors, saved) => {
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

const findAllLeases = (realm) => {
  return new Promise((resolve, reject) => {
    try {
      leaseModel.findAll(realm, (errors, leases) => {
        if (errors) {
          return reject(errors);
        }
        resolve(leases);
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Main
module.exports = async () => {
  try {
    await db.init();
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
        const leases = await findAllLeases(realm);
        const customLease = {
          name: 'custom',
          description: 'Monthly rents without time limit',
          timeRange: 'months',
          active: true,
          system: true,
          archived: false,
        };
        const french369Lease = {
          name: '369',
          description: 'French business lease limited to 9 years',
          numberOfTerms: 108,
          timeRange: 'months',
          active: true,
          system: false,
        };
        if (!leases || !leases.length) {
          dbCustomLease = await addLease(realm, customLease);
          dbFrench369Lease = await addLease(realm, french369Lease);
        } else {
          dbCustomLease = leases.find(({ system }) => system === true);
          dbFrench369Lease = leases.find(
            ({ numberOfTerms }) => numberOfTerms === 108
          );

          if (dbCustomLease) {
            dbCustomLease = await updateLease(realm, {
              ...dbCustomLease,
              ...customLease,
            });
          }

          if (dbFrench369Lease) {
            dbFrench369Lease = await updateLease(realm, {
              ...dbFrench369Lease,
              ...french369Lease,
            });
          }
        }

        const tenants = (await findAllTenants(realm)) || [];
        await Promise.all(
          tenants.map(async (dbTenant) => {
            // add the leaseId property to tenant (occupant)
            let leaseId = dbTenant.leaseId;
            if (dbCustomLease && dbFrench369Lease) {
              leaseId = String(dbCustomLease._id);
              if (dbTenant.contract === '369') {
                leaseId = String(dbFrench369Lease._id);
              }
            }

            // update the properties to add the rent and expenses of properties
            let properties = dbTenant.properties;
            properties.forEach((property) => {
              if (property.expenses) {
                return;
              }
              property.rent = property.property.price;
              property.expenses = [];

              if (!property.property.expense) {
                return;
              }

              property.expenses = [
                {
                  title: 'general expense',
                  amount: property.property.expense,
                },
              ];
            });

            await updateTenant(realm, {
              ...dbTenant,
              leaseId,
              properties,
            });
          })
        );
        // const utenants = await findAllTenants(realm);
        // console.log(utenants.map(({contract, leaseId}) => ({contract, leaseId})));

        // updatedRealm.tenants = tenants
        //     .filter(({ terminationDate }) => !terminationDate)
        //     .reduce((acc, { name, contacts }) => ([
        //         ...acc,
        //         ...contacts.map(contact => ({ tenant: name, ...contact }))
        //     ]), [])
        //     .filter(({ email }) => !!email);

        return updatedRealm;
      })
    );

    await Promise.all(
      updatedRealms.map((updatedRealm) => updateRealm(updatedRealm))
    );
  } catch (error) {
    console.error(error);
  }
};
