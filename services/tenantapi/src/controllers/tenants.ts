import { Collections, DateFormat, Middlewares } from '@microrealestate/common';
import type {
  API,
  LeaseType,
  PropertyType,
  RealmType,
  TenantType
} from '@microrealestate/shared';
import type { Request, Response } from 'express';
import moment from 'moment';

export const getAllTenants: Middlewares.AsyncRequestHandler<
  API.Tenant.GetAllTenants.RequestParams,
  API.Tenant.GetAllTenants.ResponseBody
> = async (request: Request, response: Response) => {
  const email = Middlewares.getCallerEmail(request);

  // find tenants from mongo which has a given email contact
  const dbTenants = await Collections.Tenant.find<
    TenantType<RealmType, LeaseType, PropertyType>
  >({
    'contacts.email': email
  })
    .collation({ locale: 'en', strength: 2 })
    .populate(['realmId', 'leaseId', 'properties.propertyId'])
    .sort({ beginDate: -1 })
    ?.lean();

  if (!dbTenants) {
    response.json({ results: [] });
    return;
  }

  // the last term considering the current date
  const lastTerm = Number(moment().format('YYYYMMDDHH'));

  response.json({
    results: dbTenants.map((tenant) => toTenantResponse(tenant, lastTerm))
  });
};

function toTenantResponse(
  tenant: TenantType<RealmType, LeaseType, PropertyType>,
  lastTerm: number
): API.Tenant.TenantDataType {
  const now = moment();
  const currentRent = _findCurrentRent(tenant.rents, lastTerm);
  const totalPreTaxAmount = currentRent?.total?.preTaxAmount || 0;
  const totalChargesAmount = currentRent?.total?.charges || 0;
  const vatRatio = tenant.vatRatio || 0;
  const totalVatAmount =
    Math.round((totalPreTaxAmount + totalChargesAmount) * vatRatio * 100) / 100;
  const totalAmount =
    Math.round(
      (totalPreTaxAmount + totalChargesAmount + totalVatAmount) * 100
    ) / 100;
  const { remainingIterations, remainingIterationsToPay } =
    _computeRemainingIterations(tenant, lastTerm, totalAmount);
  const landlord = tenant.realmId;
  const lease = tenant.leaseId;
  const data: API.Tenant.TenantDataType = {
    tenant: {
      id: tenant._id,
      name: tenant.name,
      isCompany: tenant.isCompany,
      company: tenant.company,
      manager: tenant.manager,
      legalForm: tenant.legalForm,
      siret: tenant.siret,
      rcs: tenant.rcs,
      capital: tenant.capital,
      contacts: tenant.contacts.map((contact) => ({
        name: contact.name ?? '',
        email: contact.email ?? '',
        phone1: contact.phone1 ?? '',
        phone2: contact.phone2 ?? ''
      })),
      addresses: [
        {
          street1: tenant.street1 ?? '',
          street2: tenant.street2,
          zipCode: tenant.zipCode,
          city: tenant.city ?? '',
          state: tenant.state ?? '',
          country: tenant.country ?? ''
        }
      ]
    },
    landlord: {
      id: landlord._id,
      name: landlord.name,
      addresses: landlord.addresses,
      contacts: landlord.contacts,
      currency: landlord.currency,
      locale: landlord.locale ?? 'en'
    },
    lease: {
      name: lease?.name ?? '',
      beginDate: tenant.beginDate,
      endDate: tenant.endDate,
      terminationDate: tenant.terminationDate,
      timeRange: lease?.timeRange ?? 'months',
      status: tenant.terminationDate
        ? moment(tenant.terminationDate, DateFormat.DATE_FORMAT).isBefore(now)
          ? 'terminated'
          : 'active'
        : moment(tenant.endDate, DateFormat.DATE_FORMAT).isBefore(now)
          ? 'ended'
          : 'active',
      rent: {
        totalPreTaxAmount,
        totalChargesAmount,
        totalVatAmount,
        totalAmount
      },
      remainingIterations,
      remainingIterationsToPay,
      properties:
        tenant.properties.map(({ propertyId, property }) => ({
          id: propertyId?._id ?? '',
          name: property.name,
          description: property.description,
          type: property.type
        })) || [],
      receipts: tenant.rents
        .filter(({ term }) => term <= lastTerm)
        .sort((r1, r2) => r2.term - r1.term)
        .map((rent) => {
          return {
            id: `${tenant._id}-${rent.term}`,
            term: rent.term,
            balance: rent.total.balance,
            grandTotal: rent.total.grandTotal,
            payment: rent.total.payment || 0,
            methods: rent.payments
              .filter((payment) => !!payment)
              .map((payment) => payment.type),
            status:
              rent.total.grandTotal - (rent.total.payment || 0) <= 0
                ? 'paid'
                : rent.total.payment > 0
                  ? 'partially-paid'
                  : 'unpaid',
            payments:
              rent.payments.map((payment) => ({
                date: payment.date,
                method: payment.type,
                reference: payment.reference,
                amount: payment.amount || 0
              })) || []
          };
        }),
      balance: _computeBalance(tenant.rents, lastTerm),
      deposit:
        (tenant.securityDeposit ?? []).reduce(
          (s, e) => s + (e.amount || 0),
          0
        ) -
        (tenant.securityDepositRefund ?? []).reduce(
          (s, e) => s + (e.amount || 0),
          0
        )
    }
  };
  return data;
}

function _computeRemainingIterations(
  tenant: TenantType<RealmType, LeaseType, PropertyType>,
  lastTerm: number,
  rentAmount: number
) {
  if (!tenant.leaseId?.timeRange) {
    return { remainingIterations: 0, remainingIterationsToPay: 0 };
  }
  const timeRange = tenant.leaseId.timeRange;
  const remainingIterations = Math.ceil(
    moment(
      tenant.terminationDate || tenant.endDate,
      DateFormat.DATE_FORMAT
    ).diff(moment(lastTerm, 'YYYYMMDDHH').startOf(timeRange), timeRange, true)
  );

  let remainingIterationsToPay = remainingIterations;
  const balance = _computeBalance(tenant.rents, lastTerm);

  if (balance === 0) {
    remainingIterationsToPay -= 1;
  } else if (balance > 0 && rentAmount > 0) {
    const nbIterationWhereRentPaid = Math.abs(balance / rentAmount);
    remainingIterationsToPay -= Math.floor(nbIterationWhereRentPaid);
  }

  return {
    remainingIterations,
    remainingIterationsToPay
  };
}

function _findCurrentRent(rents: TenantType['rents'], lastTerm: number) {
  if (!rents.length) return undefined;
  return rents.reduce((prev, curr) => (curr.term <= lastTerm ? curr : prev));
}

function _computeBalance(rents: TenantType['rents'], lastTerm: number) {
  const rent = _findCurrentRent(rents, lastTerm);
  if (!rent) return 0;
  return -rent.total.grandTotal + rent.total.payment;
}
