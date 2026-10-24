import { Collections, formatError, logger } from '@microrealestate/common';
import { PAYMENT_METHODS } from '@microrealestate/shared';
import moment from 'moment';

// i18n keys, so the document names the method in the landlord's locale.
const PAYMENT_METHOD_LABELS = {
  transfer: 'Bank transfer',
  card: 'Card',
  cash: 'Cash',
  cheque: 'Cheque',
  direct_debit: 'Direct debit',
  other: 'Other'
};

// A legacy value outside the const array prints as "Other" rather than raw.
function paymentMethodLabel(type) {
  return PAYMENT_METHODS.includes(type)
    ? PAYMENT_METHOD_LABELS[type]
    : PAYMENT_METHOD_LABELS.other;
}

export async function getRentsData(params) {
  const { id: tenantId, term, realmId } = params;

  let dbTenant;
  try {
    dbTenant = await Collections.Tenant.findOne({ _id: tenantId, realmId })
      .populate('realmId')
      .populate('leaseId')
      .populate('properties.propertyId')
      .lean();
  } catch (error) {
    logger.error(formatError(error));
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
  landlord.hasBankInfo = !!landlord.bankInfo?.iban;
  landlord.hasAddress = !!landlord.addresses?.length;
  landlord.hasContact = !!landlord.contacts?.length;
  landlord.companyInfo = landlord.companyInfo ?? {};

  let rents = [];
  if (dbTenant.rents.length) {
    rents = dbTenant.rents
      .filter((rent) => String(rent.term).startsWith(term))
      .map((rent) => ({
        ...rent,
        period: rent.term,
        billingReference: `${moment(rent.term, 'YYYYMMDDHH').format('MM_YY_')}${
          dbTenant.reference
        }`,
        // The stored order is insertion order; a document reads chronologically.
        payments: [...(rent.payments || [])]
          .sort((a, b) => String(a.date).localeCompare(String(b.date)))
          .map((payment) => ({
            ...payment,
            methodLabel: paymentMethodLabel(payment.type)
          })),
        total: {
          ...rent.total,
          payment: rent.total.payment || 0,
          subTotal:
            rent.total.preTaxAmount +
            rent.total.charges -
            rent.total.discount +
            rent.total.debts,
          newBalance: rent.total.grandTotal - (rent.total.payment || 0),
          amountDue: Math.max(
            0,
            rent.total.grandTotal - (rent.total.payment || 0)
          )
        }
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
      legalRepresentative: dbTenant.manager
    },
    addresses: [
      {
        street1: dbTenant.street1,
        street2: dbTenant.street2,
        city: dbTenant.city,
        state: dbTenant.state,
        country: dbTenant.country
      }
    ],
    contract: {
      name: dbTenant.contract,
      lease: dbTenant.leaseId,
      beginDate: dbTenant.beginDate,
      endDate: dbTenant.endDate,
      properties: dbTenant.properties.reduce((acc, { propertyId }) => {
        acc.push(propertyId);
        return acc;
      }, [])
    },
    rents
  };
  if (dbTenant.terminationDate) {
    tenant.contract.terminationDate = dbTenant.terminationDate;
  }

  return {
    fileName: `${dbTenant.name}-${term}`,
    tenant,
    landlord
  };
}

export function avoidWeekend(aMoment) {
  const day = aMoment.isoWeekday();
  if (day === 6) {
    // if saturday shift the due date to friday
    aMoment.subtract(1, 'days');
  } else if (day === 7) {
    // if sunday shift the due date to friday
    aMoment.subtract(2, 'days');
  }
  return aMoment;
}
