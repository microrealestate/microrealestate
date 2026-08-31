import {
  DateFormat,
  type Middlewares,
  ServiceError
} from '@microrealestate/common';
import type { API } from '@microrealestate/shared';
import i18n from 'i18n';
import { Parser } from 'json2csv';
import moment from 'moment';
import {
  _fetchData,
  _getPropertiesAsString,
  sumDeposit,
  type TenantData
} from './shared';

interface NumberFormatObj {
  format: (value: number) => string | number;
}

interface IncomingTenant {
  _id: string;
  name: string;
  reference: string;
  properties: string;
  beginDate: string;
  endDate: string;
  terminationDate: string;
  securityDeposit: string | number;
}

function _incomingTenants(
  tenants: TenantData[],
  locale: string,
  currency: string
): IncomingTenant[] {
  const NumberFormat: NumberFormatObj = Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  });

  return tenants
    .filter(({ incoming }) => incoming)
    .map((tenant) => {
      const beginDate = moment(tenant.beginDate, DateFormat.DATE_FORMAT)
        .locale(locale)
        .format('L');
      const endDate = moment(tenant.endDate, DateFormat.DATE_FORMAT)
        .locale(locale)
        .format('L');
      const terminationDate = tenant.terminationDate
        ? moment(tenant.terminationDate, DateFormat.DATE_FORMAT)
            .locale(locale)
            .format('L')
        : '';

      return {
        _id: tenant._id,
        name: tenant.name,
        reference: tenant.reference,
        properties: _getPropertiesAsString(tenant),
        beginDate,
        endDate,
        terminationDate,
        securityDeposit: NumberFormat.format(sumDeposit(tenant.securityDeposit))
      };
    });
}

interface OutgoingTenant {
  _id: string;
  name: string;
  reference: string;
  properties: string;
  beginDate: string;
  endDate: string;
  terminationDate: string;
  securityDeposit: string | number;
  securityDepositRefund: string | number;
  balance: string | number;
  finalBalance: string | number;
}

function _outgoingTenants(
  tenants: TenantData[],
  locale: string,
  currency: string
): OutgoingTenant[] {
  const NumberFormat: NumberFormatObj = Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  });

  return tenants
    .filter(({ outgoing }) => outgoing)
    .map((tenant) => {
      const beginDate = moment(tenant.beginDate, DateFormat.DATE_FORMAT)
        .locale(locale)
        .format('L');
      const endDate = moment(tenant.endDate, DateFormat.DATE_FORMAT)
        .locale(locale)
        .format('L');
      const terminationDate = tenant.terminationDate
        ? moment(tenant.terminationDate, DateFormat.DATE_FORMAT)
            .locale(locale)
            .format('L')
        : '';
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
        properties: _getPropertiesAsString(tenant),
        beginDate,
        endDate,
        terminationDate,
        securityDeposit: NumberFormat.format(securityDeposit),
        securityDepositRefund: NumberFormat.format(securityDepositRefund),
        balance: NumberFormat.format(balance),
        finalBalance: NumberFormat.format(
          balance - securityDeposit + securityDepositRefund
        )
      };
    });
}

interface SettlementForCsv {
  tenantId: string;
  tenant: string;
  beginDate: string;
  endDate: string;
  settlements: Record<string, string>;
}

function _getSettlementsForCSV(
  tenants: TenantData[],
  locale: string,
  currency: string
): SettlementForCsv[] {
  const NumberFormat = Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  });

  const months = moment.localeData(locale).months();

  return tenants.map((tenant) => {
    const beginDate = moment(tenant.beginDate, DateFormat.DATE_FORMAT)
      .locale(locale)
      .format('L');
    const endDate = moment(
      tenant.terminationDate || tenant.endDate,
      DateFormat.DATE_FORMAT
    )
      .locale(locale)
      .format('L');

    const settlements: Record<string, string> = {};
    months.forEach((m) => {
      settlements[m] = '';
    });

    tenant.rents.forEach(({ month, payments }) => {
      const monthName = months[month - 1];
      if (monthName) {
        settlements[monthName] = payments
          .map(({ date, type, amount, reference }) => {
            const formattedDate = moment(date, DateFormat.DATE_FORMAT)
              .locale(locale)
              .format('L');
            return `${formattedDate} ${i18n.__(
              type
            )} ${reference}\n${NumberFormat.format(amount)}`;
          })
          .join('\n\n');
      }
    });

    return {
      tenantId: tenant._id,
      tenant: `${tenant.name}\n${
        tenant.reference
      }\n${beginDate} - ${endDate}\n${i18n.__('Deposit: {{deposit}}', {
        deposit: NumberFormat.format(sumDeposit(tenant.securityDeposit))
      })}\n${tenant.properties.map(({ name }) => name).join('\n')}`,
      beginDate,
      endDate,
      settlements
    };
  });
}

export const incomingTenantsAsCsv: Middlewares.AsyncRequestHandler<
  API.Landlord.Accounting.GetCsvIncomingTenants.RequestParams,
  API.Landlord.Accounting.GetCsvIncomingTenants.ResponseBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) {
    throw new ServiceError('Realm not found', 500);
  }
  const realmId = String(realm._id);
  const year = req.params?.year
    ? Number(req.params?.year)
    : new Date().getFullYear();
  const locale = realm.locale ?? 'en';
  i18n.setLocale(locale);

  const tenants = await _fetchData(realmId, year);
  const data = _incomingTenants(tenants, locale, realm.currency);
  const fields = [
    { label: i18n.__('Name'), value: 'name' },
    { label: i18n.__('Reference'), value: 'reference' },
    { label: i18n.__('Properties'), value: 'properties' },
    { label: i18n.__('Contract begin date'), value: 'beginDate' },
    { label: i18n.__('Contract end date'), value: 'endDate' },
    { label: i18n.__('Contract termination date'), value: 'terminationDate' },
    { label: i18n.__('Security deposit'), value: 'securityDeposit' }
  ];
  const json2csvParser = new Parser({
    fields,
    delimiter: ';',
    withBOM: true
  });
  const csv = json2csvParser.parse(data);
  res.header('Content-Type', 'text/csv');
  res.send(csv);
};

export const outgoingTenantsAsCsv: Middlewares.AsyncRequestHandler<
  API.Landlord.Accounting.GetCsvOutgoingTenants.RequestParams,
  API.Landlord.Accounting.GetCsvOutgoingTenants.ResponseBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) {
    throw new ServiceError('Realm not found', 500);
  }
  const realmId = String(realm._id);
  const year = req.params?.year
    ? Number(req.params?.year)
    : new Date().getFullYear();
  const locale = realm.locale ?? 'en';
  i18n.setLocale(locale);

  const tenants = await _fetchData(realmId, year);
  const data = _outgoingTenants(tenants, locale, realm.currency);
  const fields = [
    { label: i18n.__('Name'), value: 'name' },
    { label: i18n.__('Reference'), value: 'reference' },
    { label: i18n.__('Properties'), value: 'properties' },
    { label: i18n.__('Contract begin date'), value: 'beginDate' },
    { label: i18n.__('Contract end date'), value: 'endDate' },
    { label: i18n.__('Contract termination date'), value: 'terminationDate' },
    { label: i18n.__('Security deposit'), value: 'securityDeposit' },
    {
      label: i18n.__('Refunded security deposit'),
      value: 'securityDepositRefund'
    },
    { label: i18n.__('Last rent balance'), value: 'balance' },
    { label: i18n.__('Final balance'), value: 'finalBalance' }
  ];

  const json2csvParser = new Parser({
    fields,
    delimiter: ';',
    withBOM: true
  });
  const csv = json2csvParser.parse(data);
  res.header('Content-Type', 'text/csv');
  res.send(csv);
};

export const settlementsAsCsv: Middlewares.AsyncRequestHandler<
  API.Landlord.Accounting.GetCsvSettlements.RequestParams,
  API.Landlord.Accounting.GetCsvSettlements.ResponseBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) {
    throw new ServiceError('Realm not found', 500);
  }
  const realmId = String(realm._id);
  const year = req.params?.year
    ? Number(req.params?.year)
    : new Date().getFullYear();
  const locale = realm.locale ?? 'en';
  i18n.setLocale(locale);

  const tenants = await _fetchData(realmId, year);
  const data = _getSettlementsForCSV(tenants, locale, realm.currency);
  const months = moment.localeData(locale).months();
  const fields = [
    { label: i18n.__('Tenant'), value: 'tenant' },
    ...months.map((m: string) => ({ label: m, value: m }))
  ];

  const json2csvParser = new Parser({
    fields,
    delimiter: ';',
    withBOM: true
  });
  const csv = json2csvParser.parse(data);
  res.header('Content-Type', 'text/csv');
  res.send(csv);
};
