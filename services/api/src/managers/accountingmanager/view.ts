import { type Middlewares, ServiceError } from '@microrealestate/common';
import type { API, Payment } from '@microrealestate/shared';
import moment from 'moment';
import {
  _fetchData,
  _getProperties,
  sumDeposit,
  type TenantData
} from './shared';

interface IncomingTenant {
  _id: string;
  name: string;
  reference: string;
  properties: ReturnType<typeof _getProperties>;
  beginDate: string;
  endDate: string;
  terminationDate?: string;
  securityDeposit: number;
}

function _incomingTenants(tenants: TenantData[]): IncomingTenant[] {
  return tenants
    .filter(({ incoming }) => incoming)
    .map((tenant) => ({
      _id: tenant._id,
      name: tenant.name,
      reference: tenant.reference,
      properties: _getProperties(tenant),
      beginDate: tenant.beginDate,
      endDate: tenant.endDate,
      terminationDate: tenant.terminationDate,
      securityDeposit: sumDeposit(tenant.securityDeposit)
    }));
}

interface OutgoingTenant {
  _id: string;
  name: string;
  reference: string;
  properties: ReturnType<typeof _getProperties>;
  beginDate: string;
  endDate: string;
  terminationDate?: string;
  securityDeposit: number;
  securityDepositRefund: number;
  balance: number;
  finalBalance: number;
}

function _outgoingTenants(tenants: TenantData[]): OutgoingTenant[] {
  return tenants
    .filter(({ outgoing }) => outgoing)
    .map((tenant) => {
      const lastRent = tenant.rents?.length
        ? tenant.rents[tenant.rents.length - 1]
        : {
            total: { grandTotal: 0, balance: 0, payment: 0 }
          };

      // closing position of the last rent, not the balance carried into it
      const balance =
        (lastRent?.total?.grandTotal ?? 0) - (lastRent?.total?.payment ?? 0);
      const securityDeposit = sumDeposit(tenant.securityDeposit);
      const securityDepositRefund = sumDeposit(tenant.securityDepositRefund);

      return {
        _id: tenant._id,
        name: tenant.name,
        reference: tenant.reference,
        properties: _getProperties(tenant),
        beginDate: tenant.beginDate,
        endDate: tenant.endDate,
        terminationDate: tenant.terminationDate,
        securityDeposit,
        securityDepositRefund,
        balance,
        finalBalance: balance - securityDeposit + securityDepositRefund
      };
    });
}

interface Settlement {
  tenantId: string;
  tenant: string;
  beginDate: string;
  endDate: string;
  settlements: (Payment[] | null)[];
}

function _getSettlements(tenants: TenantData[], locale: string): Settlement[] {
  const months = moment.localeData(locale).months();

  return tenants.map((tenant) => {
    const beginDate = tenant.beginDate;
    const endDate = tenant.terminationDate || tenant.endDate;

    const settlements: Settlement['settlements'] = months.map(() => null);

    tenant.rents.forEach(({ month, payments }) => {
      settlements[month - 1] = payments.map(
        ({ date, type, amount, reference }) => ({
          date,
          type,
          amount,
          reference
        })
      );
    });

    return {
      tenantId: tenant._id,
      tenant: tenant.name,
      beginDate,
      endDate,
      settlements
    };
  });
}

export const all: Middlewares.AsyncRequestHandler<
  API.Landlord.Accounting.GetAccounting.RequestParams,
  API.Landlord.Accounting.GetAccounting.ResponseBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) {
    throw new ServiceError('Realm not found', 500);
  }
  const year = req.params?.year
    ? Number(req.params?.year)
    : new Date().getFullYear();

  const tenants = await _fetchData(String(realm._id), year);
  const locale = realm.locale ?? 'en';

  res.json({
    year,
    incomingTenants: _incomingTenants(tenants),
    outgoingTenants: _outgoingTenants(tenants),
    settlements: _getSettlements(tenants, locale)
  });
};
