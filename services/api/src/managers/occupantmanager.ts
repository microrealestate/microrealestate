import {
  Collections,
  DateFormat,
  formatError,
  logger,
  type Middlewares,
  Service,
  ServiceError,
  withTransaction
} from '@microrealestate/common';
import type {
  API,
  LeaseTimeRange,
  LeaseType,
  PropertyType,
  TemplateType,
  TenantType
} from '@microrealestate/shared';
import axios from 'axios';
import moment from 'moment';
import { customAlphabet } from 'nanoid';
import * as Contract from './contract';
import * as FD from './frontdata';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 12);

// Template document enriched by aggregate + computed missing flag
type FileToUploadDoc = TemplateType & {
  documents: Array<{
    _id: string;
    expiryDate?: string;
  }>;
  missing: boolean;
};

// Tenant after aggregate + populate (leaseId and properties.propertyId are populated)
type FetchedTenant = TenantType<string, LeaseType, PropertyType> & {
  terminated?: boolean;
  filesToUpload?: FileToUploadDoc[];
};

function formatTenant(
  tenant: API.Landlord.Tenant.OccupantRequestBody
): Partial<TenantType> {
  const { frequency: _frequency, ...tenantWithoutFrequency } = tenant;
  const formattedTenant: Partial<TenantType> = {
    ...tenantWithoutFrequency,
    beginDate: tenant.beginDate,
    endDate: tenant.endDate,
    terminationDate: tenant.terminationDate,
    properties: tenant.properties?.map((property) => ({
      ...property,
      rent: property.rent,
      entryDate: (property.entryDate || tenant.beginDate) as string,
      exitDate: property.exitDate || tenant.endDate,
      expenses: property.expenses || []
    })),
    reference: tenant.reference || nanoid()
  };

  if (!formattedTenant.isCompany) {
    delete formattedTenant.company;
    delete formattedTenant.legalForm;
    delete formattedTenant.siret;
    delete formattedTenant.capital;
    formattedTenant.name = formattedTenant.name || formattedTenant.manager;
  } else {
    formattedTenant.name = formattedTenant.company ?? undefined;
  }

  return formattedTenant;
}

async function buildPropertyMap(
  realm: NonNullable<Express.Request['realm']>
): Promise<Record<string, Omit<PropertyType, '_id' | 'realmId'>>> {
  const properties = await Collections.Property.find({
    realmId: realm._id
  }).lean();

  return properties.reduce<
    Record<string, Omit<PropertyType, '_id' | 'realmId'>>
  >((acc, property) => {
    acc[String(property._id)] = property;
    return acc;
  }, {});
}

async function fetchTenants(
  realmId: string,
  tenantId?: string
): Promise<API.Landlord.Tenant.OccupantData[]> {
  const $match: Record<string, unknown> = { realmId };
  if (tenantId) {
    $match._id = new Collections.ObjectId(tenantId);
  }

  const tenants = await Collections.Tenant.aggregate<FetchedTenant>([
    { $match },
    {
      $lookup: {
        from: 'templates',
        let: {
          tenant_realmId: '$realmId',
          tenant_tenantId: { $toString: '$_id' },
          tenant_leaseId: '$leaseId'
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$realmId', '$$tenant_realmId'] },
                  { $in: ['$$tenant_leaseId', '$relatesTo'] },
                  { $eq: ['$type', 'fileDescriptor'] }
                ]
              }
            }
          },
          {
            $lookup: {
              from: 'documents',
              let: { template_templateId: { $toString: '$_id' } },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$realmId', '$$tenant_realmId'] },
                        { $eq: ['$tenantId', '$$tenant_tenantId'] },
                        { $eq: ['$leaseId', '$$tenant_leaseId'] },
                        { $eq: ['$type', 'file'] },
                        { $eq: ['$templateId', '$$template_templateId'] },
                        { $not: ['$deletedAt'] }
                      ]
                    }
                  }
                },
                {
                  $project: {
                    realmId: 0,
                    leaseId: 0,
                    tenantId: 0,
                    type: 0,
                    mimeType: 0,
                    templateId: 0,
                    url: 0
                  }
                }
              ],
              as: 'documents'
            }
          },
          {
            $project: {
              realmId: 0,
              relatesTo: 0,
              type: 0,
              hasExpiryDate: 0
            }
          }
        ],
        as: 'filesToUpload'
      }
    },
    { $sort: { name: 1 } }
  ]);

  await Collections.Tenant.populate(tenants, [
    { path: 'leaseId' },
    { path: 'properties.propertyId' }
  ]);

  // TODO: compute the missing doc property in mongodb
  const now = moment();
  tenants.forEach((tenant) => {
    tenant.filesToUpload?.forEach((fileToUpload: FileToUploadDoc) => {
      const { required, requiredOnceContractTerminated, documents } =
        fileToUpload;
      fileToUpload.missing =
        !!(required || (requiredOnceContractTerminated && tenant.terminated)) &&
        !(
          documents.length &&
          documents.some(({ expiryDate }: { expiryDate?: string }) =>
            expiryDate
              ? moment(expiryDate, DateFormat.DATE_FORMAT).isSameOrAfter(now)
              : true
          )
        );
    });
  });

  return tenants.map((tenant) => FD.toOccupantData(tenant));
}

function propertiesHaveRentData(
  properties?: TenantType['properties']
): boolean {
  return !!(
    properties?.length &&
    properties.every(
      (property) => property.rent && property.entryDate && property.exitDate
    )
  );
}

////////////////////////////////////////////////////////////////////////////////
// Exported functions
////////////////////////////////////////////////////////////////////////////////
export const add: Middlewares.AsyncRequestHandler<
  API.Landlord.Tenant.PostAddOccupant.RequestParams,
  API.Landlord.Tenant.PostAddOccupant.ResponseBody,
  API.Landlord.Tenant.PostAddOccupant.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) throw new ServiceError('Organization not found', 500);

  const { _id, ...occupant } = formatTenant(req.body);

  if (!occupant.name) {
    logger.error('missing tenant name');
    throw new ServiceError('missing fields', 422);
  }

  const propertyMap = await buildPropertyMap(realm);

  // Resolve properties
  occupant.properties?.forEach((property) => {
    const propertyInfo = propertyMap[property.propertyId];
    if (propertyInfo) {
      property.property = propertyInfo;
    }
    property.rent = property.rent || property.property?.price;
    property.expenses = property.expenses || [];
  });

  // Build rents from contract
  try {
    occupant.rents = [];
    const occupantProperties = occupant.properties;
    if (
      occupant.beginDate &&
      occupant.endDate &&
      occupantProperties &&
      propertiesHaveRentData(occupantProperties)
    ) {
      const contract = Contract.create({
        begin: occupant.beginDate,
        end: occupant.endDate,
        frequency: (req.body.frequency || 'months') as LeaseTimeRange,
        properties: occupantProperties as Contract.ContractProperty[]
      });

      occupant.rents = contract.rents;
    }
  } catch (error) {
    throw new ServiceError(error, 409);
  }

  const newOccupant = await Collections.Tenant.create({
    ...occupant,
    realmId: realm._id
  });

  const occupants = await fetchTenants(
    String(realm._id),
    String(newOccupant._id)
  );
  res.json(occupants.length ? occupants[0] : null);
};

export const update: Middlewares.AsyncRequestHandler<
  API.Landlord.Tenant.PatchUpdateOccupant.RequestParams,
  API.Landlord.Tenant.PatchUpdateOccupant.ResponseBody,
  API.Landlord.Tenant.PatchUpdateOccupant.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) throw new ServiceError('Organization not found', 500);

  const occupantId = req.params.id;
  const newOccupant = formatTenant(req.body);

  if (!newOccupant.name) {
    logger.error('missing tenant name');
    throw new ServiceError('missing fields', 422);
  }

  const propertyMap = await buildPropertyMap(realm);

  await withTransaction(async (session) => {
    const originalOccupant = await Collections.Tenant.findOne({
      _id: occupantId,
      realmId: realm._id
    })
      .session(session)
      .lean();

    if (!originalOccupant) {
      throw new ServiceError('tenant not found', 404);
    }

    newOccupant.properties = newOccupant.properties?.map((rentedProperty) => {
      // Merge properties from originalOccupant to newOccupant
      // copy property from db if not present in originalOccupant
      if (!rentedProperty.property) {
        const originalProperty = originalOccupant.properties?.find(
          ({ propertyId }) => propertyId === rentedProperty.propertyId
        );

        const property =
          originalProperty?.property || propertyMap[rentedProperty.propertyId];
        if (property) {
          rentedProperty.property = property;
        }
      }

      return rentedProperty;
    });

    // Build rents from contract
    const occupantProperties = newOccupant.properties;
    if (
      newOccupant.beginDate &&
      newOccupant.endDate &&
      occupantProperties &&
      propertiesHaveRentData(occupantProperties)
    ) {
      try {
        const termFrequency = (req.body.frequency ||
          'months') as LeaseTimeRange;

        if (originalOccupant.beginDate && originalOccupant.endDate) {
          const contract: Contract.Contract = {
            begin: originalOccupant.beginDate,
            end: originalOccupant.endDate,
            frequency: termFrequency,
            terms: Math.ceil(
              moment(originalOccupant.endDate, DateFormat.DATE_FORMAT).diff(
                moment(originalOccupant.beginDate, DateFormat.DATE_FORMAT),
                termFrequency,
                true
              )
            ),
            properties: originalOccupant.properties || [],
            vatRate: originalOccupant.vatRatio,
            discount: originalOccupant.discount,
            rents: originalOccupant.rents
          };

          const modification: Partial<Contract.Contract> = {
            begin: newOccupant.beginDate,
            end: newOccupant.endDate,
            termination: newOccupant.terminationDate,
            properties: occupantProperties as Contract.ContractProperty[],
            frequency: termFrequency
          };
          if (newOccupant.vatRatio !== undefined) {
            modification.vatRate = newOccupant.vatRatio;
          }
          if (newOccupant.discount !== undefined) {
            modification.discount = newOccupant.discount;
          }

          const newContract = Contract.update(contract, modification);
          newOccupant.rents = newContract.rents;
        } else {
          const contract: Contract.Contract = {
            begin: newOccupant.beginDate,
            end: newOccupant.endDate,
            frequency: termFrequency,
            terms: Math.ceil(
              moment(newOccupant.endDate, DateFormat.DATE_FORMAT).diff(
                moment(newOccupant.beginDate, DateFormat.DATE_FORMAT),
                termFrequency,
                true
              )
            ),
            properties: occupantProperties as Contract.ContractProperty[],
            vatRate: newOccupant.vatRatio,
            discount: newOccupant.discount
          };

          const newContract = Contract.create(contract);
          newOccupant.rents = newContract.rents;
        }
      } catch (e) {
        throw new ServiceError(e, 409);
      }
    } else {
      const paidRents = newOccupant.rents?.some(
        (rent) =>
          rent.payments?.some((payment) => payment.amount > 0) ||
          rent.discounts.some((discount) => discount.origin === 'settlement')
      );

      if (paidRents) {
        throw new ServiceError(
          'impossible to update tenant some rents have been paid',
          409
        );
      }
      newOccupant.rents = [];
    }

    await Collections.Tenant.updateOne(
      {
        realmId: realm._id,
        _id: occupantId
      },
      {
        $set: newOccupant,
        $unset: !newOccupant.isCompany
          ? { company: '', legalForm: '', siret: '', capital: '' }
          : {}
      },
      { session }
    );
  });

  const newOccupants = await fetchTenants(String(realm._id), occupantId);
  res.json(newOccupants.length ? newOccupants[0] : null);
};

export const remove: Middlewares.AsyncRequestHandler<
  API.Landlord.Tenant.DeleteRemoveOccupant.RequestParams,
  API.Landlord.Tenant.DeleteRemoveOccupant.ResponseBody,
  API.Landlord.Tenant.GetOneOccupant.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) throw new ServiceError('Organization not found', 500);

  const occupantIds = req.params.ids.split(',') || [];

  if (!occupantIds.length) {
    throw new ServiceError('tenant not found', 404);
  }

  const occupants = await Collections.Tenant.find({
    realmId: realm._id,
    _id: { $in: occupantIds }
  })?.lean();

  if (!occupants.length) {
    throw new ServiceError('tenant not found', 404);
  }

  const occupantsWithPaidRents = occupants.filter((occupant) => {
    return occupant.rents.some(
      (rent) =>
        rent.payments?.some((payment) => payment.amount > 0) ||
        rent.discounts.some((discount) => discount.origin === 'settlement')
    );
  });

  if (occupantsWithPaidRents.length) {
    const firstOccupant = occupantsWithPaidRents[0];
    throw new ServiceError(
      `impossible to remove ${String(firstOccupant?.name)} some rents have been paid`,
      409
    );
  }

  const session = await Collections.startSession();
  session.startTransaction();
  try {
    const documents = await Collections.Document.find(
      {
        realmId: realm._id,
        'relatesTo.tenants': { $in: occupantIds }
      },
      {
        _id: 1
      }
    )
      .setOptions({ includeDeleted: true })
      .lean();

    const { PDFGENERATOR_URL } = Service.getInstance().envConfig.getValues();
    const documentIds = documents.map(({ _id }) => String(_id));
    if (documentIds.length) {
      try {
        await axios.post(
          `${PDFGENERATOR_URL}/documents/purge`,
          { ids: documentIds },
          {
            headers: {
              authorization: req.headers.authorization,
              'Accept-Language': req.headers['accept-language']
            }
          }
        );
      } catch (error) {
        logger.error('purge documents failed');
        logger.error(formatError(error));
      }
    }

    // remove tenants in db
    await Collections.Tenant.deleteMany({
      realmId: realm._id,
      _id: { $in: occupantIds }
    });
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw new ServiceError(error, 500);
  } finally {
    session.endSession();
  }
  res.sendStatus(200);
};

export const all: Middlewares.AsyncRequestHandler<
  API.Landlord.Tenant.GetAllOccupants.RequestParams,
  API.Landlord.Tenant.GetAllOccupants.ResponseBody,
  API.Landlord.Tenant.GetAllOccupants.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) throw new ServiceError('Organization not found', 500);

  res.json(await fetchTenants(String(realm._id)));
};

export const one: Middlewares.AsyncRequestHandler<
  API.Landlord.Tenant.GetOneOccupant.RequestParams,
  API.Landlord.Tenant.GetOneOccupant.ResponseBody,
  API.Landlord.Tenant.GetOneOccupant.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) throw new ServiceError('Organization not found', 500);

  const occupantId = req.params.id;
  const occupants = await fetchTenants(String(realm._id), occupantId);
  res.json(occupants.length ? occupants[0] : null);
};

export const overview: Middlewares.AsyncRequestHandler<
  API.Landlord.Tenant.GetOccupantsOverview.RequestParams,
  API.Landlord.Tenant.GetOccupantsOverview.ResponseBody,
  API.Landlord.Tenant.GetOccupantsOverview.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) throw new ServiceError('Organization not found', 500);

  const currentDate = moment();

  const occupants = await Collections.Tenant.find({
    realmId: realm._id
  }).lean();

  let result = {
    countAll: occupants?.length || 0,
    countActive: 0,
    countInactive: 0
  };

  result = occupants.reduce((acc, occupant) => {
    const endMoment = moment(
      occupant.terminationDate || occupant.endDate,
      DateFormat.DATE_FORMAT
    );
    if (endMoment.isBefore(currentDate, 'day')) {
      acc.countInactive++;
    } else {
      acc.countActive++;
    }
    return acc;
  }, result);

  res.json(result);
};
