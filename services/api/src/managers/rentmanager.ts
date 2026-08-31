import {
  Collections,
  DateFormat,
  formatError,
  logger,
  type Middlewares,
  Service,
  ServiceError
} from '@microrealestate/common';
import type { API, Rent, TenantType } from '@microrealestate/shared';
import axios from 'axios';
import type { Moment } from 'moment';
import moment from 'moment';
import * as Contract from './contract';
import * as FD from './frontdata';

type Realm = NonNullable<Express.Request['realm']>;

type LeanTenant = TenantType & { _id: string; frequency?: string };

function acceptLanguageHeader(raw: string | string[] | undefined): string {
  if (Array.isArray(raw)) {
    return raw[0] ?? '';
  }
  return raw ?? '';
}

function toRentView(
  ...args: Parameters<typeof FD.toRentData>
): API.Landlord.Rent.RentViewData {
  return FD.toRentData(...args);
}

type EmailerStatusRow = {
  recordId: string;
  templateName: string;
  sentTo: string;
  sentDate: string;
};

type EmailStatusByTenant = Record<
  string,
  Record<string, API.Landlord.Rent.RentEmailSendRecord[]>
>;

async function _findOccupants(
  realm: Realm,
  tenantId: string | null | undefined,
  startTerm?: number,
  endTerm?: number
): Promise<LeanTenant[]> {
  const $and: Record<string, unknown>[] = [{ realmId: realm._id }];
  if (tenantId) {
    $and.push({ _id: tenantId });
  }
  if (startTerm !== undefined && endTerm !== undefined) {
    $and.push({ 'rents.term': { $gte: startTerm } });
    $and.push({ 'rents.term': { $lte: endTerm } });
  } else if (startTerm !== undefined) {
    $and.push({ 'rents.term': startTerm });
  }

  const dbTenants = await Collections.Tenant.find({ $and })
    .sort({
      name: 1
    })
    .lean();

  return dbTenants.map((tenant) => {
    const t = tenant as LeanTenant;
    t._id = String(t._id);
    if (startTerm !== undefined && endTerm !== undefined) {
      t.rents = t.rents.filter(
        (rent) => rent.term >= startTerm && rent.term <= endTerm
      );
    } else if (startTerm !== undefined) {
      t.rents = t.rents.filter((rent) => rent.term === startTerm);
    }
    return t;
  });
}

async function _getEmailStatus(
  authorizationHeader: string | undefined,
  locale: string,
  startTerm: number,
  endTerm?: number
): Promise<EmailStatusByTenant> {
  const { EMAILER_URL } = Service.getInstance().envConfig.getValues();
  try {
    let emailEndPoint = `${EMAILER_URL}/status/${startTerm}`;
    if (endTerm !== undefined) {
      emailEndPoint = `${EMAILER_URL}/status/${startTerm}/${endTerm}`;
    }
    const response = await axios.get<EmailerStatusRow[]>(emailEndPoint, {
      headers: {
        authorization: authorizationHeader,
        'Accept-Language': locale
      }
    });
    logger.debug('email statuses fetched');
    return response.data.reduce<EmailStatusByTenant>((acc, status) => {
      const data = {
        sentTo: status.sentTo,
        sentDate: status.sentDate
      };
      if (!acc[status.recordId]) {
        acc[status.recordId] = { [status.templateName]: [] };
      }
      const bucket = acc[status.recordId] as Record<
        string,
        API.Landlord.Rent.RentEmailSendRecord[]
      >;
      let documents = bucket[status.templateName];
      if (!documents) {
        documents = [];
        bucket[status.templateName] = documents;
      }
      documents.push(data);
      return acc;
    }, {});
  } catch (error: unknown) {
    logger.error(formatError(error));
    if (
      typeof error === 'object' &&
      error !== null &&
      'data' in error &&
      (error as { data: unknown }).data !== undefined
    ) {
      throw (error as { data: unknown }).data;
    }
    throw error;
  }
}

async function _getRentsDataByTerm(
  authorizationHeader: string | undefined,
  locale: string,
  realm: Realm,
  currentDate: Moment,
  frequency: moment.unitOfTime.StartOf
): Promise<API.Landlord.Rent.GetRentsByMonth.ResponseBody> {
  const startTerm = Number(currentDate.startOf(frequency).format('YYYYMMDDHH'));
  const endTerm = Number(currentDate.endOf(frequency).format('YYYYMMDDHH'));

  const [dbOccupants, emailStatus = {}] = await Promise.all([
    _findOccupants(realm, null, startTerm, endTerm),
    _getEmailStatus(authorizationHeader, locale, startTerm, endTerm).catch(
      (error: unknown) => {
        logger.error(formatError(error));
        return {} as EmailStatusByTenant;
      }
    )
  ]);

  const rents = dbOccupants.reduce<API.Landlord.Rent.RentViewData[]>(
    (acc, occupant) => {
      acc.push(
        ...occupant.rents
          .filter((rent) => rent.term >= startTerm && rent.term <= endTerm)
          .map((rent) => toRentView(rent, occupant, emailStatus[occupant._id]))
      );
      return acc;
    },
    []
  );

  const overview: API.Landlord.Rent.RentMonthOverview = {
    countAll: 0,
    countPaid: 0,
    countPartiallyPaid: 0,
    countNotPaid: 0,
    totalToPay: 0,
    totalPaid: 0,
    totalNotPaid: 0
  };
  rents.reduce((acc, rent) => {
    if (rent.totalAmount <= 0 || rent.newBalance >= 0) {
      acc.countPaid++;
    } else if (rent.payment > 0) {
      acc.countPartiallyPaid++;
    } else {
      acc.countNotPaid++;
    }
    acc.countAll++;
    acc.totalToPay += rent.totalToPay;
    acc.totalPaid += rent.payment;
    acc.totalNotPaid -= rent.newBalance < 0 ? rent.newBalance : 0;
    return acc;
  }, overview);

  return { overview, rents };
}

async function _updateByTerm(
  authorizationHeader: string | undefined,
  locale: string,
  realm: Realm,
  term: string,
  paymentData: API.Landlord.Rent.PatchRentPaymentRequestBody
): Promise<API.Landlord.Rent.RentViewData> {
  if (!paymentData.promo && Number(paymentData.promo) <= 0) {
    paymentData.promo = 0;
    paymentData.notepromo = null;
  }

  if (!paymentData.extracharge && Number(paymentData.extracharge) <= 0) {
    paymentData.extracharge = 0;
    paymentData.noteextracharge = null;
  }

  const occupantRaw = await Collections.Tenant.findOne({
    _id: paymentData._id,
    realmId: realm._id
  }).lean();

  if (!occupantRaw) {
    throw new ServiceError('tenant not found', 404);
  }

  const occupant = occupantRaw as LeanTenant;

  if (!occupant.beginDate || !occupant.endDate) {
    throw new ServiceError('tenant has no contract dates', 500);
  }
  const contract: Contract.Contract = {
    frequency: (occupant.frequency ||
      'months') as Contract.Contract['frequency'],
    begin: occupant.beginDate,
    end: occupant.endDate,
    discount: occupant.discount || 0,
    vatRate: occupant.vatRatio,
    properties: occupant.properties,
    rents: occupant.rents as Rent[]
  };

  const settlements: Contract.Settlement = {
    payments: [],
    debts: [],
    discounts: [],
    description: ''
  };

  if (paymentData.payments?.length) {
    settlements.payments = paymentData.payments
      .filter(({ amount }) => amount && Number(amount) > 0)
      .map((payment) => ({
        date: DateFormat.formatDate(payment.date) ?? '',
        amount: Number(payment.amount),
        type: payment.type || '',
        reference: payment.reference || '',
        description: payment.description || ''
      })) as Contract.Settlement['payments'];
  }

  if (paymentData.promo) {
    settlements.discounts = settlements.discounts ?? [];
    settlements.discounts.push({
      origin: 'settlement',
      description: paymentData.notepromo || '',
      amount:
        paymentData.promo * (contract.vatRate ? 1 / (1 + contract.vatRate) : 1)
    });
  }

  if (paymentData.extracharge) {
    settlements.debts = settlements.debts ?? [];
    settlements.debts.push({
      description: paymentData.noteextracharge || '',
      amount:
        paymentData.extracharge *
        (contract.vatRate ? 1 / (1 + contract.vatRate) : 1)
    });
  }

  if (paymentData.description) {
    settlements.description = paymentData.description;
  }

  const paidContract = Contract.payTerm(contract, term, settlements);
  occupant.rents = paidContract.rents ?? [];

  const emailStatus =
    (await _getEmailStatus(authorizationHeader, locale, Number(term)).catch(
      (error: unknown) => {
        logger.error(formatError(error));
        return {} as EmailStatusByTenant;
      }
    )) || {};

  const savedOccupantRaw = await Collections.Tenant.findOneAndUpdate(
    {
      _id: occupant._id,
      realmId: realm._id
    },
    occupant,
    { new: true }
  ).lean();

  if (!savedOccupantRaw) {
    throw new ServiceError('tenant not found', 404);
  }

  const savedOccupant = savedOccupantRaw as LeanTenant;

  const rent = savedOccupant.rents.find((r) => r.term === Number(term));
  if (!rent) {
    throw new ServiceError('rent not found', 404);
  }

  return toRentView(
    rent,
    savedOccupant,
    emailStatus[String(savedOccupant._id)]
  );
}

export const updateByTerm: Middlewares.AsyncRequestHandler<
  API.Landlord.Rent.PatchPaymentByTerm.RequestParams,
  API.Landlord.Rent.PatchPaymentByTerm.ResponseBody,
  API.Landlord.Rent.PatchPaymentByTerm.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) {
    throw new ServiceError('Realm not found', 500);
  }
  const term = req.params.term;
  const authorizationHeader = req.headers.authorization;
  const locale = acceptLanguageHeader(req.headers['accept-language']);
  const paymentData = req.body;

  res.json(
    await _updateByTerm(authorizationHeader, locale, realm, term, paymentData)
  );
};

export const rentsOfOccupant: Middlewares.AsyncRequestHandler<
  API.Landlord.Rent.GetTenantRents.RequestParams,
  API.Landlord.Rent.GetTenantRents.ResponseBody,
  API.Landlord.Rent.GetTenantRents.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) {
    throw new ServiceError('Realm not found', 500);
  }
  const { id } = req.params;
  const term = Number(moment().format('YYYYMMDDHH'));

  const dbOccupants = await _findOccupants(realm, id);
  if (!dbOccupants.length) {
    res.sendStatus(404);
    return;
  }

  const dbOccupant = dbOccupants[0];
  if (!dbOccupant) {
    res.sendStatus(404);
    return;
  }

  const rentsToReturn = dbOccupant.rents.map((currentRent) => {
    const rent = toRentView(currentRent);
    if (currentRent.term === term) {
      rent.active = 'active';
    }
    rent.vatRatio = dbOccupant.vatRatio;
    return rent;
  });

  res.json({
    occupant: FD.toOccupantData(dbOccupant) as API.Landlord.Tenant.OccupantData,
    rents: rentsToReturn
  });
};

export const rentOfOccupantByTerm: Middlewares.AsyncRequestHandler<
  API.Landlord.Rent.GetTenantRentByTerm.RequestParams,
  API.Landlord.Rent.GetTenantRentByTerm.ResponseBody,
  API.Landlord.Rent.GetTenantRentByTerm.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) {
    throw new ServiceError('Realm not found', 500);
  }
  const { id, term } = req.params;

  res.json(
    await _rentOfOccupant(
      req.headers.authorization,
      acceptLanguageHeader(req.headers['accept-language']),
      realm,
      id,
      term
    )
  );
};

async function _rentOfOccupant(
  authorizationHeader: string | undefined,
  locale: string,
  realm: Realm,
  tenantId: string,
  term: string
): Promise<API.Landlord.Rent.RentViewData> {
  const [dbOccupants = [], emailStatus = {}] = await Promise.all([
    _findOccupants(realm, tenantId, Number(term)).catch((error: unknown) => {
      logger.error(formatError(error));
      return [] as LeanTenant[];
    }),
    _getEmailStatus(authorizationHeader, locale, Number(term)).catch(
      (error: unknown) => {
        logger.error(formatError(error));
        return {} as EmailStatusByTenant;
      }
    )
  ]);

  if (!dbOccupants.length) {
    throw new ServiceError('tenant not found', 404);
  }
  const dbOccupant = dbOccupants[0];
  if (!dbOccupant) {
    throw new ServiceError('tenant not found', 404);
  }

  const firstRent = dbOccupant.rents[0];
  if (!firstRent) {
    throw new ServiceError('rent not found', 404);
  }
  const rent = toRentView(firstRent, dbOccupant, emailStatus[dbOccupant._id]);
  if (rent.term === Number(moment().format('YYYYMMDDHH'))) {
    rent.active = 'active';
  }
  rent.vatRatio = dbOccupant.vatRatio;

  return rent;
}

export const all: Middlewares.AsyncRequestHandler<
  API.Landlord.Rent.GetRentsByMonth.RequestParams,
  API.Landlord.Rent.GetRentsByMonth.ResponseBody,
  API.Landlord.Rent.GetRentsByMonth.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) {
    throw new ServiceError('Realm not found', 500);
  }

  let currentDate = moment().startOf('month');
  if (req.params.year && req.params.month) {
    currentDate = moment(`${req.params.month}/${req.params.year}`, 'MM/YYYY');
  }

  res.json(
    await _getRentsDataByTerm(
      req.headers.authorization,
      acceptLanguageHeader(req.headers['accept-language']),
      realm,
      currentDate,
      'months'
    )
  );
};
