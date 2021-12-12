const moment = require('moment');

const Tenant = require('@mre/common/models/tenant');

async function getRentsData(params) {
  const { id: tenantId, term } = params;

  let dbTenant;
  try {
    dbTenant = await Tenant.findOne({ _id: tenantId })
      .populate('realmId')
      .populate('leaseId')
      .populate('properties.propertyId');
  } catch (error) {
    // TODO: replace with logger.error
    console.error(error);
  }
  if (!dbTenant) {
    throw new Error(`tenant ${tenantId} not found`);
  }

  const landlord = dbTenant.realmId;
  landlord.name =
    (landlord.isCompany
      ? landlord.companyInfo?.name
      : landlord.contacts?.[0]?.name) || '';
  landlord.hasCompanyInfo = !!landlord.companyInfo;
  landlord.hasBankInfo = !!landlord.bankInfo;
  landlord.hasAddress = !!landlord.addresses?.length;
  landlord.hasContact = !!landlord.contacts?.length;

  let rents = [];
  if (dbTenant.rents.length) {
    rents = dbTenant.rents
      .filter((rent) => rent.term === Number(term))
      .map((rent) => ({
        ...rent,
        period: rent.term,
        billingReference: `${moment(rent.term, 'YYYYMMDDHH').format('MM_YY_')}${
          dbTenant.reference
        }`,
        total: {
          ...rent.total,
          payment: rent.total.payment || 0,
          subTotal:
            rent.total.preTaxAmount +
            rent.total.charges -
            rent.total.discount +
            rent.total.debts,
          newBalance: rent.total.grandTotal - rent.total.payment,
        },
      }));
  }

  const tenant = {
    name: dbTenant.isCompany ? dbTenant.company : dbTenant.name,
    isCompany: dbTenant.isCompany,
    companyInfo: {
      name: dbTenant.company,
      capital: dbTenant.capital,
      ein: dbTenant.siret,
      dos: dbTenant.rcs,
      vatNumber: dbTenant.vatNumber,
      legalRepresentative: dbTenant.manager,
    },
    addresses: [
      {
        street1: dbTenant.street1,
        street2: dbTenant.street2,
        city: dbTenant.city,
        state: dbTenant.state,
        country: dbTenant.country,
      },
    ],
    contract: {
      name: dbTenant.contract,
      lease: dbTenant.leaseId,
      beginDate: dbTenant.beginDate,
      endDate: dbTenant.endDate,
      properties: dbTenant.properties.reduce((acc, { propertyId }) => {
        acc.push(propertyId);
        return acc;
      }, []),
    },
    rents,
  };
  if (dbTenant.terminationDate) {
    tenant.contract.terminationDate = dbTenant.terminationDate;
  }

  return {
    today: moment().format('DD/MM/YYYY'),
    fileName: `${dbTenant.name}-${term}`,
    tenant,
    landlord,
  };
}

module.exports = {
  getRentsData,
};
