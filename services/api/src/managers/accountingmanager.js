import { Collections } from '@microrealestate/typed-common';
import i18n from 'i18n';
import moment from 'moment';
import { Parser } from 'json2csv';

async function _fetchData(realmId, year) {
  return await Collections.Tenant.aggregate([
    {
      $match: {
        realmId,
        'rents.year': year
      }
    },
    {
      $addFields: {
        nameLowerCase: { $toLower: '$name' }, // to sort ignoring the case
        properties: {
          $map: {
            input: '$properties',
            as: 'p',
            in: {
              _id: '$$p.property._id',
              type: '$$p.property.type',
              name: '$$p.property.name'
            }
          }
        },
        rents: {
          $map: {
            input: '$rents',
            as: 'rent',
            in: {
              year: '$$rent.year',
              month: '$$rent.month',
              payments: '$$rent.payments',
              total: '$$rent.total'
            }
          }
        }
      }
    },
    {
      // done in a separate stage to rely on endDate computed in the previous stage
      $addFields: {
        incoming: {
          $and: [
            { $gte: ['$beginDate', new Date(`${year}-01-01T00:00:00`)] },
            { $lt: ['$beginDate', new Date(`${year + 1}-01-01T00:00:00`)] }
          ]
        },
        outgoing: {
          $or: [
            {
              $and: [
                {
                  $gte: ['$terminationDate', new Date(`${year}-01-01T00:00:00`)]
                },
                {
                  $lt: [
                    '$terminationDate',
                    new Date(`${year + 1}-01-01T00:00:00`)
                  ]
                }
              ]
            },
            {
              $and: [
                { $gte: ['$endDate', new Date(`${year}-01-01T00:00:00`)] },
                { $lt: ['$endDate', new Date(`${year + 1}-01-01T00:00:00`)] }
              ]
            }
          ]
        }
      }
    },
    {
      $sort: {
        nameLowerCase: 1
      }
    },
    {
      $project: {
        realmId: 1,
        _id: 1,
        name: 1,
        incoming: 1,
        outgoing: 1,
        reference: 1,
        beginDate: 1,
        endDate: 1,
        terminationDate: 1,
        guaranty: 1,
        guarantyPayback: 1,
        properties: 1,
        rents: {
          $filter: {
            input: '$rents',
            as: 'rent',
            cond: {
              $eq: ['$$rent.year', year]
            }
          }
        }
      }
    }
  ]);
}

function _properties(tenant, rawData = true) {
  if (rawData) {
    return tenant.properties.map(({ _id, name, type }) => ({
      _id,
      name,
      type
    }));
  }

  return tenant.properties.map(({ name }) => name).join('\n');
}

function _incomingTenants(tenants, locale, currency, rawData = true) {
  const NumberFormat = !rawData
    ? Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2
      })
    : { format: (value) => value };

  return tenants
    .filter(({ incoming }) => incoming)
    .map((tenant) => {
      const beginDate = rawData
        ? tenant.beginDate
        : moment(tenant.beginDate).locale(locale).format('L');
      const endDate = rawData
        ? tenant.endDate
        : moment(tenant.endDate).locale(locale).format('L');
      const terminationDate = rawData
        ? tenant.terminationDate
        : tenant.terminationDate
          ? moment(tenant.terminationDate).locale(locale).format('L')
          : '';

      return {
        _id: tenant._id,
        name: tenant.name,
        reference: tenant.reference,
        properties: _properties(tenant, rawData),
        beginDate,
        endDate,
        terminationDate,
        guaranty: NumberFormat.format(tenant.guaranty || 0)
      };
    });
}

function _outgoingTenants(tenants, locale, currency, rawData = true) {
  const NumberFormat = !rawData
    ? Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2
      })
    : { format: (value) => value };

  return tenants
    .filter(({ outgoing }) => outgoing)
    .map((tenant) => {
      const beginDate = rawData
        ? tenant.beginDate
        : moment(tenant.beginDate).locale(locale).format('L');
      const endDate = rawData
        ? tenant.endDate
        : moment(tenant.endDate).locale(locale).format('L');
      const terminationDate = rawData
        ? tenant.terminationDate
        : tenant.terminationDate
          ? moment(tenant.terminationDate).locale(locale).format('L')
          : '';
      const lastRent = tenant.rents?.length
        ? tenant.rents[tenant.rents.length - 1]
        : {
            total: { grandTotal: 0 }
          };

      return {
        _id: tenant._id,
        name: tenant.name,
        reference: tenant.reference,
        properties: _properties(tenant, rawData),
        beginDate,
        endDate,
        terminationDate,
        guaranty: NumberFormat.format(tenant.guaranty || 0),
        guarantyPayback: NumberFormat.format(tenant.guarantyPayback || 0),
        balance: NumberFormat.format(
          (lastRent.total.payment ? lastRent.total.payment : 0) -
            lastRent.total.grandTotal
        ),
        finalBalance: NumberFormat.format(
          (lastRent.total.payment ? lastRent.total.payment : 0) +
            (tenant.guaranty ? tenant.guaranty : 0) -
            (tenant.guarantyPayback ? tenant.guarantyPayback : 0) -
            lastRent.total.grandTotal
        )
      };
    });
}

function _settlements(tenants, locale, currency, rawData = true) {
  const NumberFormat = Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  });

  const months = moment.localeData(locale).months();

  return tenants.map((tenant) => {
    const beginDate = rawData
      ? tenant.beginDate
      : moment(tenant.beginDate).locale(locale).format('L');
    const endDate = rawData
      ? tenant.terminationDate || tenant.endDate
      : moment(tenant.terminationDate || tenant.endDate)
          .locale(locale)
          .format('L');
    const settlements = rawData
      ? months.map(() => null)
      : months.reduce((acc, m) => {
          acc[m] = '';
          return acc;
        }, {});

    tenant.rents.forEach(({ month, payments }) => {
      if (rawData) {
        settlements[month - 1] = payments.map(
          ({ date, type, amount, reference }) => ({
            date: moment(date, 'DD/MM/YYYY').toDate(),
            type,
            amount,
            reference
          })
        );
      } else {
        settlements[months[month - 1]] = payments
          .map(({ date, type, amount, reference }) => {
            return `${date} ${i18n.__(
              type
            )} ${reference}\n${NumberFormat.format(amount)}`;
          })
          .join('\n\n');
      }
    });

    return rawData
      ? {
          tenantId: tenant._id,
          tenant: tenant.name,
          beginDate,
          endDate,
          settlements
        }
      : {
          tenantId: tenant._id,
          tenant: rawData
            ? tenant.name
            : `${tenant.name}\n${
                tenant.reference
              }\n${beginDate} - ${endDate}\n${i18n.__('Deposit: {{deposit}}', {
                deposit: NumberFormat.format(tenant.guaranty)
              })}\n${tenant.properties.map(({ name }) => name).join('\n')}`,
          ...settlements
        };
  });
}

////////////////////////////////////////////////////////////////////////////////
// Exported functions
////////////////////////////////////////////////////////////////////////////////
export async function all(req, res) {
  const realm = req.realm;
  const year = req.params?.year
    ? Number(req.params?.year)
    : new Date().getFullYear;

  const tenants = await _fetchData(String(realm._id), year);

  res.json({
    year,
    incomingTenants: _incomingTenants(tenants),
    outgoingTenants: _outgoingTenants(tenants),
    settlements: _settlements(tenants, realm.locale, realm.currency)
  });
}

async function incomingTenantsAsCsv(req, res) {
  const realm = req.realm;
  const realmId = String(realm._id);
  const year = req.params?.year
    ? Number(req.params?.year)
    : new Date().getFullYear;
  i18n.setLocale(realm.locale);

  const tenants = await _fetchData(realmId, year);
  const data = _incomingTenants(tenants, realm.locale, realm.currency, false);
  const fields = [
    {
      label: i18n.__('Name'),
      value: 'name'
    },
    {
      label: i18n.__('Reference'),
      value: 'reference'
    },
    {
      label: i18n.__('Properties'),
      value: 'properties'
    },
    {
      label: i18n.__('Contract begin date'),
      value: 'beginDate'
    },
    {
      label: i18n.__('Contract end date'),
      value: 'endDate'
    },
    {
      label: i18n.__('Contract termination date'),
      value: 'terminationDate'
    },
    {
      label: i18n.__('Deposit'),
      value: 'guaranty'
    }
  ];
  const json2csv = new Parser({ fields, delimiter: ';', withBOM: true });
  const csv = json2csv.parse(data);
  res.header('Content-Type', 'text/csv');
  return res.send(csv);
}

async function outgoingTenantsAsCsv(req, res) {
  const realm = req.realm;
  const realmId = String(realm._id);
  const year = req.params?.year
    ? Number(req.params?.year)
    : new Date().getFullYear;

  i18n.setLocale(realm.locale);

  const tenants = await _fetchData(realmId, year);
  const data = _outgoingTenants(tenants, realm.locale, realm.currency, false);
  const fields = [
    {
      label: i18n.__('Name'),
      value: 'name'
    },
    {
      label: i18n.__('Reference'),
      value: 'reference'
    },
    {
      label: i18n.__('Properties'),
      value: 'properties'
    },
    {
      label: i18n.__('Contract begin date'),
      value: 'beginDate'
    },
    {
      label: i18n.__('Contract end date'),
      value: 'endDate'
    },
    {
      label: i18n.__('Contract termination date'),
      value: 'terminationDate'
    },
    {
      label: i18n.__('Deposit'),
      value: 'guaranty'
    },
    {
      label: i18n.__('Refunded deposit'),
      value: 'guarantyPayback'
    },
    {
      label: i18n.__('Last rent balance'),
      value: 'balance'
    },
    {
      label: i18n.__('Final balance'),
      value: 'finalBalance'
    }
  ];

  const json2csv = new Parser({ fields, delimiter: ';', withBOM: true });
  const csv = json2csv.parse(data);
  res.header('Content-Type', 'text/csv');
  return res.send(csv);
}

async function settlementsAsCsv(req, res) {
  const realm = req.realm;
  const realmId = String(realm._id);
  const year = req.params?.year
    ? Number(req.params?.year)
    : new Date().getFullYear;
  i18n.setLocale(realm.locale);

  const tenants = await _fetchData(realmId, year);
  const data = _settlements(tenants, realm.locale, realm.currency, false);
  const months = moment.localeData(realm.locale).months();
  const fields = [
    {
      label: i18n.__('Tenant'),
      value: 'tenant'
    },
    ...months
  ];

  const json2csv = new Parser({ fields, delimiter: ';', withBOM: true });
  const csv = json2csv.parse(data);
  res.header('Content-Type', 'text/csv');
  return res.send(csv);
}

export const csv = {
  incomingTenants: incomingTenantsAsCsv,
  outgoingTenants: outgoingTenantsAsCsv,
  settlements: settlementsAsCsv
};
