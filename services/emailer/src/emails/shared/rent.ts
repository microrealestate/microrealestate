import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  Collections,
  DateFormat,
  formatError,
  logger,
  Service,
  Storage
} from '@microrealestate/common';
import type {
  EmailName,
  LeaseType,
  PropertyType,
  RealmType,
  Rent,
  TenantType
} from '@microrealestate/shared';
import axios from 'axios';
import i18n from 'i18n';
import moment from 'moment';
import { TEMPORARY_DIRECTORY } from '../../directories';
import type { Attachment, EmailRef, RunContext } from '../../engine/types';
import { toLandlordData } from './landlord';

// ---------------------------------------------------------------------------------------------
// The ref shared by receipt, rentnotice, rentnotice_reminder, rentnotice_last_reminder
// ---------------------------------------------------------------------------------------------

export interface RentEmailRef extends EmailRef {
  params: { term: number };
}

// ---------------------------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------------------------

export function amountDue(rent: Rent): number {
  return Math.max(0, rent.total.grandTotal - (rent.total.payment || 0));
}

function avoidWeekend(aMoment: moment.Moment): moment.Moment {
  const day = aMoment.isoWeekday();
  if (day === 6) {
    // if saturday shift the due date to friday
    aMoment.subtract(1, 'days');
  } else if (day === 7) {
    // if sunday shift the due date to monday
    aMoment.add(1, 'days');
  }
  return aMoment;
}

export function computeDueDate(
  term: number,
  timeRange: string | undefined,
  beginDateTxt: string | undefined
): moment.Moment {
  const momentTerm = moment(String(term), 'YYYYMMDDHH');
  const beginDate = moment(beginDateTxt, DateFormat.DATE_FORMAT);

  let dueDate = moment(momentTerm);
  if (timeRange === 'years') {
    dueDate.add(1, 'months');
  } else if (timeRange === 'months') {
    dueDate.add(10, 'days');
  } else if (timeRange === 'weeks') {
    dueDate.add(2, 'days');
  }
  avoidWeekend(dueDate);
  if (dueDate.isBefore(beginDate)) {
    dueDate = moment(beginDate);
  }
  return dueDate;
}

// ---------------------------------------------------------------------------------------------
// Template contexts
// ---------------------------------------------------------------------------------------------

async function findTenant(
  tenantId: string,
  realmId: string
): Promise<TenantType<RealmType, LeaseType, PropertyType>> {
  if (!realmId) {
    throw new Error('no organization in the request context');
  }

  const tenant = (await Collections.Tenant.findOne({ _id: tenantId, realmId })
    .populate('realmId')
    .populate('leaseId')
    .populate('properties.propertyId')
    .lean()) as TenantType<RealmType, LeaseType, PropertyType> | null;

  if (!tenant) {
    throw new Error('tenant not found');
  }
  if (!tenant.rents.length) {
    throw new Error('tenant has no rents');
  }
  return tenant;
}

export async function buildRentData(
  { recordId: tenantId, params: { term } }: RentEmailRef,
  ctx: RunContext
) {
  const dbTenant = await findTenant(tenantId, ctx.realmId);

  const landlord = toLandlordData(dbTenant.realmId as RealmType);
  const lease = dbTenant.leaseId as LeaseType | undefined;

  const rents = dbTenant.rents
    .filter((rent) => rent.term === Number(term))
    .map((rent) => ({
      ...rent,
      total: {
        ...rent.total,
        payment: rent.total.payment || 0,
        amountDue: amountDue(rent)
      }
    }));
  if (!rents.length) {
    throw new Error(`no rent for term ${term}`);
  }

  const tenant = {
    ...dbTenant,
    contract: {
      name: dbTenant.contract,
      lease,
      beginDate: dbTenant.beginDate,
      endDate: dbTenant.endDate,
      properties: dbTenant.properties.reduce<PropertyType[]>(
        (acc, { propertyId }) => {
          acc.push(propertyId as PropertyType);
          return acc;
        },
        []
      )
    },
    rents
  };

  return {
    landlord,
    tenant,
    period: Number(term),
    today: moment().format(DateFormat.DATE_FORMAT)
  };
}

export async function buildRentNoticeData(ref: RentEmailRef, ctx: RunContext) {
  const { landlord, tenant, period } = await buildRentData(ref, ctx);
  const momentTerm = moment(String(ref.params.term), 'YYYYMMDDHH');
  const momentToday = moment();

  const dueDate = computeDueDate(
    ref.params.term,
    tenant.contract.lease?.timeRange,
    tenant.contract.beginDate
  );

  let billingDay = momentToday;
  if (dueDate.isSameOrBefore(momentToday)) {
    billingDay = avoidWeekend(moment(momentTerm));
  }

  return {
    landlord,
    tenant,
    period,
    today: billingDay.format(DateFormat.DATE_FORMAT),
    billingRef: `${momentTerm.format('MM_YY')}_${tenant.reference}`,
    dueDate: dueDate.format(DateFormat.DATE_FORMAT)
  };
}

// ---------------------------------------------------------------------------------------------
// Attachments — fetched from pdfgenerator
// ---------------------------------------------------------------------------------------------

const PDF_TIMEOUT = 60000;

async function downloadPdf(
  name: string,
  recordId: string,
  term: number,
  ctx: RunContext
): Promise<string> {
  const { PDFGENERATOR_URL } = Service.getInstance().envConfig.getValues();
  const uri = `${PDFGENERATOR_URL}/documents/${name}/${recordId}/${term}`;
  const fileDir = path.join(TEMPORARY_DIRECTORY, name);
  fs.mkdirSync(fileDir, { recursive: true });
  const filePath = path.join(fileDir, `${randomUUID()}.pdf`);
  const wStream = fs.createWriteStream(filePath);

  const response = await axios.get(uri, {
    responseType: 'stream',
    timeout: PDF_TIMEOUT,
    headers: {
      authorization: ctx.authorization
    }
  });

  const declared = Number(response.headers['content-length']);

  return Storage.streamToFile(response.data, wStream, filePath, {
    timeoutMs: PDF_TIMEOUT,
    stallMessage: `pdf download for ${name} stalled`,
    expectedBytes: Number.isFinite(declared) ? declared : undefined
  });
}

/**
 * Fetches the rent document from pdfgenerator. Curried on the email name, which the slot signature
 * does not carry. The temporary file is removed once read; the directory is wiped on boot too.
 */
export function rentPdf(name: EmailName) {
  return async (
    data: {
      period: number;
      tenant: { _id: unknown; name: string; reference: string };
    },
    ctx: RunContext
  ): Promise<Attachment[]> => {
    i18n.setLocale(ctx.locale);
    const billingRef = `${moment(String(data.period), 'YYYYMMDDHH')
      .locale(ctx.locale)
      .format('MM_YY')}_${data.tenant.reference}`;
    const filename = Storage.sanitizeSegment(
      `${i18n.__(name)}-${data.tenant.name}-${billingRef}.pdf`
    );

    const filePath = await downloadPdf(
      name,
      String(data.tenant._id),
      data.period,
      ctx
    );
    const content = fs.readFileSync(filePath);
    try {
      fs.rmSync(filePath, { force: true });
    } catch (error) {
      logger.error(formatError(error as Error));
    }

    return [{ filename, content }];
  };
}
