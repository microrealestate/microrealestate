import {
  Collections,
  DateFormat,
  logger,
  type Middlewares,
  ServiceError
} from '@microrealestate/common';
import type { API } from '@microrealestate/shared';
import moment from 'moment';
import type { PipelineStage } from 'mongoose';

function _validateYearMonth(
  year: string,
  month: string | null = null
): boolean {
  if (
    !year ||
    Number.isNaN(parseInt(year, 10)) ||
    parseInt(year, 10) < 1000 ||
    parseInt(year, 10) > 9999
  ) {
    return false;
  }
  if (month !== null) {
    if (
      !month ||
      Number.isNaN(parseInt(month, 10)) ||
      parseInt(month, 10) < 1 ||
      parseInt(month, 10) > 12
    ) {
      return false;
    }
  }
  return true;
}

export const tenantCount: Middlewares.AsyncRequestHandler<
  API.Landlord.Dashboard.GetTenantsCount.RequestParams,
  API.Landlord.Dashboard.GetTenantsCount.ResponseBody
> = async (req, res) => {
  const { year } = req.params;
  if (!_validateYearMonth(year)) {
    throw new ServiceError(
      'Invalid year format. Year must be a 4-digit number.',
      400
    );
  }

  try {
    const beginOfYear = moment(`${year}-01-01`);
    const endOfYear = moment(`${year}-12-31`).endOf('day');

    const pipeline: PipelineStage[] = [
      {
        $match: {
          realmId: req.realm?._id,
          beginDate: { $lte: endOfYear.format(DateFormat.DATE_FORMAT) }
        }
      },
      {
        $project: {
          endDateOrTerminationDate: {
            $ifNull: ['$terminationDate', '$endDate']
          }
        }
      },
      {
        $match: {
          endDateOrTerminationDate: {
            $gte: beginOfYear.format(DateFormat.DATE_FORMAT)
          }
        }
      },
      {
        $count: 'count'
      }
    ];

    const [result] = await Collections.Tenant.aggregate<{ count: number }>(
      pipeline
    );
    res.json({ count: result?.count || 0 });
  } catch (error) {
    logger.error(`Error counting tenants for year ${year}:`, error);
    throw new ServiceError('Failed to count tenants', 500);
  }
};

export const propertyCount: Middlewares.AsyncRequestHandler<
  Record<string, never>,
  API.Landlord.Dashboard.GetPropertiesCount.ResponseBody
> = async (req, res) => {
  try {
    const count = await Collections.Property.countDocuments({
      realmId: req.realm?._id
    });

    res.json({ count });
  } catch (error) {
    logger.error('Error counting properties:', error);
    throw new ServiceError('Failed to count properties', 500);
  }
};

export const occupancyRate: Middlewares.AsyncRequestHandler<
  API.Landlord.Dashboard.GetOccupancyRate.RequestParams,
  API.Landlord.Dashboard.GetOccupancyRate.ResponseBody
> = async (req, res) => {
  const { year } = req.params;
  if (!_validateYearMonth(year)) {
    throw new ServiceError(
      'Invalid year format. Year must be a 4-digit number.',
      400
    );
  }

  try {
    const beginOfYear = moment(`${year}-01-01`);
    const endOfYear = moment(`${year}-12-31`).endOf('day');

    const propertyCount = await Collections.Property.countDocuments({
      realmId: req.realm?._id
    });

    const beginOfYearStr = beginOfYear.format(DateFormat.DATE_FORMAT);
    const endOfYearStr = endOfYear.format(DateFormat.DATE_FORMAT);
    const pipeline: PipelineStage[] = [
      {
        $match: {
          realmId: req.realm?._id,
          beginDate: { $lte: endOfYearStr },
          $or: [
            { terminationDate: { $gte: beginOfYearStr } },
            { endDate: { $gte: beginOfYearStr } }
          ],
          $nor: [
            { endDate: { $lt: beginOfYearStr } },
            { terminationDate: { $lt: beginOfYearStr } }
          ]
        }
      },
      {
        $unwind: '$properties'
      },
      {
        $group: {
          _id: '$properties.propertyId'
        }
      },
      {
        $count: 'uniqueRentedProperties'
      }
    ];

    const [rentedResult] = await Collections.Tenant.aggregate<{
      uniqueRentedProperties: number;
    }>(pipeline);
    const uniqueRentedProperties = rentedResult?.uniqueRentedProperties || 0;

    const rate = propertyCount > 0 ? uniqueRentedProperties / propertyCount : 0;
    res.json({ rate });
  } catch (error) {
    logger.error(`Error calculating occupancy rate for year ${year}:`, error);
    throw new ServiceError('Failed to calculate occupancy rate', 500);
  }
};

export const totalYearRevenues: Middlewares.AsyncRequestHandler<
  API.Landlord.Dashboard.GetTotalYearRevenues.RequestParams,
  API.Landlord.Dashboard.GetTotalYearRevenues.ResponseBody
> = async (req, res) => {
  const { year } = req.params;
  if (!_validateYearMonth(year)) {
    throw new ServiceError(
      'Invalid year format. Year must be a 4-digit number.',
      400
    );
  }

  try {
    const beginOfYear = moment(`${year}-01-01`);
    const endOfYear = moment(`${year}-12-31`).endOf('day');

    const pipeline: PipelineStage[] = [
      {
        $match: {
          realmId: req.realm?._id
        }
      },
      {
        $unwind: '$rents'
      },
      {
        $unwind: '$rents.payments'
      },
      {
        $match: {
          'rents.payments.date': { $exists: true, $nin: ['', null] },
          'rents.payments.amount': { $ne: 0, $exists: true }
        }
      },
      {
        $match: {
          'rents.payments.date': {
            $gte: beginOfYear.format(DateFormat.DATE_FORMAT),
            $lte: endOfYear.format(DateFormat.DATE_FORMAT)
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$rents.payments.amount' }
        }
      }
    ];

    const [result] = await Collections.Tenant.aggregate<{ total: number }>(
      pipeline
    );
    res.json({ total: result?.total || 0 });
  } catch (error) {
    logger.error(
      `Error calculating total year revenues for year ${year}:`,
      error
    );
    throw new ServiceError('Failed to calculate total year revenues', 500);
  }
};

export const monthRevenues: Middlewares.AsyncRequestHandler<
  API.Landlord.Dashboard.GetMonthRevenues.RequestParams,
  API.Landlord.Dashboard.GetMonthRevenues.ResponseBody
> = async (req, res) => {
  const { year, month } = req.params;
  if (!_validateYearMonth(year, month)) {
    throw new ServiceError(
      'Invalid year or month format. Year must be a 4-digit number and month must be between 1-12.',
      400
    );
  }

  try {
    const beginOfMonth = moment(`${year}-${month}-01`).startOf('month');
    const endOfMonth = moment(`${year}-${month}-01`).endOf('month');

    const pipeline: PipelineStage[] = [
      {
        $match: {
          realmId: req.realm?._id
        }
      },
      {
        $unwind: '$rents'
      },
      {
        $match: {
          'rents.term': {
            $gte: parseInt(beginOfMonth.format('YYYYMMDDHH'), 10),
            $lte: parseInt(endOfMonth.format('YYYYMMDDHH'), 10)
          }
        }
      },
      {
        $group: {
          _id: null,
          paid: { $sum: '$rents.total.payment' },
          notPaid: {
            $sum: {
              $cond: [
                { $lt: ['$rents.total.payment', '$rents.total.grandTotal'] },
                {
                  $subtract: ['$rents.total.payment', '$rents.total.grandTotal']
                },
                0
              ]
            }
          },
          paidCount: {
            $sum: {
              $cond: [
                { $gte: ['$rents.total.payment', '$rents.total.grandTotal'] },
                1,
                0
              ]
            }
          },
          partiallyPaidCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ['$rents.total.payment', 0] },
                    { $lt: ['$rents.total.payment', '$rents.total.grandTotal'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          notPaidCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$rents.total.payment', 0] },
                    { $gt: ['$rents.total.grandTotal', 0] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ];

    const [result] = await Collections.Tenant.aggregate<{
      paid: number;
      notPaid: number;
      paidCount: number;
      partiallyPaidCount: number;
      notPaidCount: number;
    }>(pipeline);
    res.json({
      paid: result?.paid || 0,
      notPaid: Math.abs(result?.notPaid || 0),
      paidCount: result?.paidCount || 0,
      partiallyPaidCount: result?.partiallyPaidCount || 0,
      notPaidCount: result?.notPaidCount || 0
    });
  } catch (error) {
    logger.error(
      `Error calculating month revenues for ${year}/${month}:`,
      error
    );
    throw new ServiceError('Failed to calculate month revenues', 500);
  }
};

export const revenuesBreakdown: Middlewares.AsyncRequestHandler<
  API.Landlord.Dashboard.GetRevenuesBreakdown.RequestParams,
  API.Landlord.Dashboard.GetRevenuesBreakdown.ResponseBody
> = async (req, res) => {
  const { year } = req.params;
  if (!_validateYearMonth(year)) {
    throw new ServiceError(
      'Invalid year format. Year must be a 4-digit number.',
      400
    );
  }

  try {
    const beginOfYear = moment(`${year}-01-01`);
    const endOfYear = moment(`${year}-12-31`).endOf('day');

    const pipeline: PipelineStage[] = [
      {
        $match: {
          realmId: req.realm?._id
        }
      },
      {
        $unwind: '$rents'
      },
      {
        $match: {
          'rents.term': {
            $gte: parseInt(beginOfYear.format('YYYYMMDDHH'), 10),
            $lte: parseInt(endOfYear.format('YYYYMMDDHH'), 10)
          }
        }
      },
      {
        $addFields: {
          termString: {
            $toString: '$rents.term'
          }
        }
      },
      {
        $addFields: {
          monthKey: {
            $substr: ['$termString', 0, 6]
          }
        }
      },
      {
        $group: {
          _id: '$monthKey',
          paid: { $sum: '$rents.total.payment' },
          notPaid: {
            $sum: {
              $cond: [
                { $lt: ['$rents.total.payment', '$rents.total.grandTotal'] },
                {
                  $subtract: ['$rents.total.payment', '$rents.total.grandTotal']
                },
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          month: '$_id',
          paid: { $round: ['$paid', 2] },
          notPaid: { $round: ['$notPaid', 2] }
        }
      },
      {
        $sort: { month: 1 }
      }
    ];

    const result =
      await Collections.Tenant.aggregate<
        API.Landlord.Dashboard.GetRevenuesBreakdown.ResponseBody[number]
      >(pipeline);
    res.json(result);
  } catch (error) {
    logger.error(
      `Error calculating revenues breakdown for year ${year}:`,
      error
    );
    throw new ServiceError('Failed to calculate revenues breakdown', 500);
  }
};

export const topUnpaid: Middlewares.AsyncRequestHandler<
  API.Landlord.Dashboard.GetTopUnpaid.RequestParams,
  API.Landlord.Dashboard.GetTopUnpaid.ResponseBody
> = async (req, res) => {
  const { year, month } = req.params;
  if (!_validateYearMonth(year, month)) {
    throw new ServiceError(
      'Invalid year or month format. Year must be a 4-digit number and month must be between 1-12.',
      400
    );
  }

  try {
    const beginOfMonth = moment(`${year}-${month}-01`).startOf('month');
    const endOfMonth = moment(`${year}-${month}-01`).endOf('month');

    const pipeline: PipelineStage[] = [
      {
        $match: {
          realmId: req.realm?._id,
          beginDate: { $lte: endOfMonth.format(DateFormat.DATE_FORMAT) },
          $or: [
            {
              terminationDate: {
                $gte: beginOfMonth.format(DateFormat.DATE_FORMAT)
              }
            },
            { endDate: { $gte: beginOfMonth.format(DateFormat.DATE_FORMAT) } }
          ]
        }
      },
      {
        $unwind: '$rents'
      },
      {
        $match: {
          'rents.term': {
            $gte: parseInt(beginOfMonth.format('YYYYMMDDHH'), 10),
            $lte: parseInt(endOfMonth.format('YYYYMMDDHH'), 10)
          }
        }
      },
      {
        $addFields: {
          balance: {
            $subtract: ['$rents.total.payment', '$rents.total.grandTotal']
          }
        }
      },
      {
        $match: {
          balance: { $lt: 0 }
        }
      },
      {
        $sort: { balance: 1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          _id: 0,
          tenant: {
            _id: '$_id',
            name: '$name',
            reference: '$reference'
          },
          balance: 1,
          rent: '$rents'
        }
      }
    ];

    const result =
      await Collections.Tenant.aggregate<
        API.Landlord.Dashboard.GetTopUnpaid.ResponseBody[number]
      >(pipeline);
    res.json(result);
  } catch (error) {
    logger.error(
      `Error fetching top unpaid tenants for ${year}/${month}:`,
      error
    );
    throw new ServiceError('Failed to fetch top unpaid tenants', 500);
  }
};

export const rentsCount: Middlewares.AsyncRequestHandler<
  API.Landlord.Dashboard.GetRentsCount.RequestParams,
  API.Landlord.Dashboard.GetRentsCount.ResponseBody
> = async (req, res) => {
  const { year, month } = req.params;
  if (!_validateYearMonth(year, month)) {
    throw new ServiceError(
      'Invalid year or month format. Year must be a 4-digit number and month must be between 1-12.',
      400
    );
  }

  try {
    const beginOfMonth = moment(`${year}-${month}-01`).startOf('month');
    const endOfMonth = moment(`${year}-${month}-01`).endOf('month');

    const count = await Collections.Tenant.aggregate<{ count: number }>([
      {
        $match: {
          realmId: req.realm?._id
        }
      },
      {
        $unwind: '$rents'
      },
      {
        $match: {
          'rents.term': {
            $gte: parseInt(beginOfMonth.format('YYYYMMDDHH'), 10),
            $lte: parseInt(endOfMonth.format('YYYYMMDDHH'), 10)
          }
        }
      },
      {
        $count: 'count'
      }
    ]);

    res.json({ count: count[0]?.count || 0 });
  } catch (error) {
    logger.error(`Error counting rents for ${year}/${month}:`, error);
    throw new ServiceError('Failed to count rents', 500);
  }
};

export const contractsNearRenewal: Middlewares.AsyncRequestHandler<
  Record<string, string>,
  API.Landlord.Dashboard.GetContractsNearRenewal.ResponseBody,
  unknown,
  API.Landlord.Dashboard.GetContractsNearRenewal.RequestQuery
> = async (req, res) => {
  try {
    const { days } = req.query;
    const daysThreshold = days ? parseInt(days, 10) : 90;
    const now = moment().startOf('day');
    const thresholdDate = moment().startOf('day').add(daysThreshold, 'days');

    const nowStr = now.format(DateFormat.DATE_FORMAT);
    const thresholdStr = thresholdDate.format(DateFormat.DATE_FORMAT);
    const pipeline: PipelineStage[] = [
      {
        $match: {
          realmId: req.realm?._id,
          beginDate: { $lte: nowStr },
          endDate: {
            $gte: nowStr,
            $lte: thresholdStr
          },
          terminationDate: { $in: [null, undefined] },
          leaseId: { $exists: true, $nin: [null, ''] }
        }
      },
      {
        $lookup: {
          from: 'leases',
          let: { tenant_leaseId: '$leaseId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: [{ $toString: '$_id' }, '$$tenant_leaseId'] }
              }
            },
            { $project: { _id: 0, autoRenew: 1 } }
          ],
          as: 'lease'
        }
      },
      {
        $addFields: {
          endDateParsed: {
            $dateFromString: {
              dateString: '$endDate',
              format: '%Y-%m-%dT%H:%M'
            }
          }
        }
      },
      {
        $addFields: {
          daysRemaining: {
            $subtract: [
              { $dateTrunc: { date: '$endDateParsed', unit: 'day' } },
              { $dateTrunc: { date: now.toDate(), unit: 'day' } }
            ]
          }
        }
      },
      {
        $project: {
          _id: '$_id',
          name: '$name',
          reference: '$reference',
          beginDate: '$beginDate',
          endDate: '$endDate',
          leaseId: '$leaseId',
          autoRenew: {
            $ifNull: [{ $first: '$lease.autoRenew' }, false]
          },
          daysRemaining: {
            $divide: ['$daysRemaining', 86400000]
          }
        }
      },
      {
        $sort: { daysRemaining: 1 }
      }
    ];

    const result = await Collections.Tenant.aggregate<{
      _id: string;
      name: string;
      reference: string;
      beginDate: string;
      endDate: string;
      leaseId: string;
      autoRenew: boolean;
      daysRemaining: number;
    }>(pipeline);

    res.json(
      result.map((tenant) => ({
        ...tenant,
        daysRemaining: Math.ceil(tenant.daysRemaining)
      }))
    );
  } catch (error) {
    logger.error('Error fetching contracts near renewal:', error);
    throw new ServiceError('Failed to fetch contracts near renewal', 500);
  }
};
