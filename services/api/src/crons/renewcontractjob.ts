import {
  Collections,
  DateFormat,
  logger,
  Service
} from '@microrealestate/common';
import type { LeaseType, TenantType } from '@microrealestate/shared';
import { CronJob } from 'cron';
import moment from 'moment';
import { renew } from '../managers/contract';

type PopulatedTenant = TenantType<string, LeaseType, string>;

const RENEWAL_MARGIN_DAYS = 7;
const MAX_RENEWALS_PER_RUN = 1000;

export function start() {
  const { PRODUCTION } = Service.getInstance().envConfig.getValues();

  CronJob.from({
    cronTime: PRODUCTION ? '0 0 0 * * *' : '*/30 * * * * *',
    onTick: runRenewalJob,
    start: true
  });

  logger.info('[cron:contract-renewal] started');
}

async function runRenewalJob() {
  try {
    logger.info('[cron:contract-renewal] tick fired');
    const result = await renewExpiredContracts();
    logger.info(
      `[cron:contract-renewal] completed: ${result.renewed} contracts renewed`
    );
  } catch (error) {
    logger.error('[cron:contract-renewal] job failed', error);
  }
}

async function renewExpiredContracts() {
  const now = moment().startOf('day');
  const marginStartDate = moment()
    .startOf('day')
    .subtract(RENEWAL_MARGIN_DAYS, 'days');

  const autoRenewLeaseIds = (
    await Collections.Lease.find({ autoRenew: true }).distinct('_id')
  ).map(String);

  if (autoRenewLeaseIds.length === 0) {
    logger.debug('[cron:contract-renewal] no lease with autoRenew enabled');
    return { renewed: 0 };
  }

  const tenantsToRenew = await Collections.Tenant.find({
    terminationDate: { $in: [null, undefined] },
    endDate: {
      $gte: marginStartDate.format(DateFormat.DATE_FORMAT),
      $lte: now.format(DateFormat.DATE_FORMAT)
    },
    leaseId: { $in: autoRenewLeaseIds }
  })
    .populate('leaseId')
    .limit(MAX_RENEWALS_PER_RUN)
    .lean();

  if (tenantsToRenew.length === 0) {
    logger.debug(
      '[cron:contract-renewal] no contracts with autoRenew enabled to renew'
    );
    return { renewed: 0 };
  }

  logger.info(
    `[cron:contract-renewal] found ${tenantsToRenew.length} contracts to renew`
  );

  let renewedCount = 0;
  for (const tenant of tenantsToRenew as PopulatedTenant[]) {
    try {
      const lease = tenant.leaseId as LeaseType;
      if (!tenant.beginDate || !tenant.endDate || !lease.timeRange) {
        logger.error(
          `[cron:contract-renewal] missing required dates for tenant: ${tenant.name}`
        );
        continue;
      }
      const tenantContract = {
        begin: tenant.beginDate,
        end: tenant.endDate,
        rents: tenant.rents,
        terms: lease.numberOfTerms,
        frequency: lease.timeRange,
        properties: tenant.properties
      };
      const renewedContract = renew(tenantContract);
      const updatedTenant = {
        ...tenant,
        endDate: renewedContract.end,
        rents: renewedContract.rents,
        properties: renewedContract.properties,
        lastRenewedAt: DateFormat.now()
      };

      await Collections.Tenant.updateOne(
        { _id: tenant._id },
        {
          $set: {
            endDate: updatedTenant.endDate,
            rents: updatedTenant.rents,
            properties: updatedTenant.properties,
            lastRenewedAt: updatedTenant.lastRenewedAt
          },
          $inc: {
            renewalCount: 1
          }
        }
      );

      logger.info(
        `[cron:contract-renewal] renewed contract for tenant: ${tenant.name}`
      );
      renewedCount++;
    } catch (error) {
      logger.error(
        `[cron:contract-renewal] failed to renew contract for tenant: ${tenant.name}`,
        error
      );
    }
  }

  return { renewed: renewedCount };
}
