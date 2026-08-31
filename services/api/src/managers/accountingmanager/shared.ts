import { Collections } from '@microrealestate/common';
import type {
  Payment,
  PropertyKind,
  SecurityDepositEntry
} from '@microrealestate/shared';

interface TenantProperty {
  _id: string;
  name: string;
  type?: PropertyKind;
}

interface RentTotal {
  grandTotal: number;
  balance: number;
  payment: number;
}

export interface Rent {
  term: string;
  year: number;
  month: number;
  payments: Payment[];
  total: RentTotal;
}

export interface TenantData {
  _id: string;
  realmId: string;
  name: string;
  reference: string;
  beginDate: string;
  endDate: string;
  terminationDate?: string;
  securityDeposit?: SecurityDepositEntry[];
  securityDepositRefund?: SecurityDepositEntry[];
  properties: TenantProperty[];
  rents: Rent[];
  incoming: boolean;
  outgoing: boolean;
}

export async function _fetchData(
  realmId: string,
  year: number
): Promise<TenantData[]> {
  return await Collections.Tenant.aggregate([
    {
      $match: {
        realmId,
        $expr: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: '$rents',
                  as: 'rent',
                  cond: {
                    $eq: [{ $toInt: { $substr: ['$$rent.term', 0, 4] } }, year]
                  }
                }
              }
            },
            0
          ]
        }
      }
    },
    {
      $addFields: {
        nameLowerCase: { $toLower: '$name' },
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
              term: '$$rent.term',
              year: { $toInt: { $substr: ['$$rent.term', 0, 4] } },
              month: { $toInt: { $substr: ['$$rent.term', 4, 2] } },
              payments: '$$rent.payments',
              total: '$$rent.total'
            }
          }
        }
      }
    },
    {
      $addFields: {
        incoming: {
          $and: [
            { $gte: ['$beginDate', `${year}-01-01T00:00`] },
            { $lt: ['$beginDate', `${year + 1}-01-01T00:00`] }
          ]
        },
        outgoing: {
          $or: [
            {
              $and: [
                {
                  $gte: ['$terminationDate', `${year}-01-01T00:00`]
                },
                {
                  $lt: ['$terminationDate', `${year + 1}-01-01T00:00`]
                }
              ]
            },
            {
              $and: [
                { $gte: ['$endDate', `${year}-01-01T00:00`] },
                { $lt: ['$endDate', `${year + 1}-01-01T00:00`] }
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
        securityDeposit: 1,
        securityDepositRefund: 1,
        properties: 1,
        rents: {
          $filter: {
            input: '$rents',
            as: 'rent',
            cond: {
              $eq: ['$$rent.year', { $literal: year }]
            }
          }
        }
      }
    }
  ]);
}

export function _getProperties(tenant: TenantData): TenantProperty[] {
  return tenant.properties.map(({ _id, name, type }) => ({
    _id,
    name,
    type
  }));
}

export function _getPropertiesAsString(tenant: TenantData): string {
  return tenant.properties.map(({ name }) => name).join('\n');
}

export function sumDeposit(entries?: { amount: number }[]): number {
  return entries?.reduce((s, e) => s + (e.amount ?? 0), 0) ?? 0;
}
