import * as Contract from './contract.js';
import * as FD from './frontdata.js';
import {
  Collections,
  logger,
  Service,
  ServiceError
} from '@microrealestate/common';
import axios from 'axios';
import { customAlphabet } from 'nanoid';
import moment from 'moment';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 12);

function _stringToDate(dateString) {
  return dateString ? moment(dateString, 'DD/MM/YYYY').toDate() : undefined;
}

function _formatTenant(tenant) {
  const formattedTenant = {
    ...tenant,
    beginDate: _stringToDate(tenant.beginDate),
    endDate: _stringToDate(tenant.endDate),
    terminationDate: _stringToDate(tenant.terminationDate),
    properties: tenant.properties?.map((property) => ({
      ...property,
      entryDate:
        _stringToDate(property.entryDate) || _stringToDate(tenant.beginDate),
      exitDate:
        _stringToDate(property.exitDate) || _stringToDate(tenant.endDate),
      expenses: property.expenses?.map((expense) => ({
        ...expense,
        beginDate: _stringToDate(expense.beginDate),
        endDate: _stringToDate(expense.endDate)
      }))
    })),
    reference: tenant.reference || nanoid()
  };

  if (!formattedTenant.isCompany) {
    formattedTenant.company = null;
    formattedTenant.legalForm = null;
    formattedTenant.siret = null;
    formattedTenant.capital = null;
    formattedTenant.name = formattedTenant.name || formattedTenant.manager;
  } else {
    formattedTenant.name = formattedTenant.company;
  }

  return formattedTenant;
}

async function _buildPropertyMap(realm) {
  const properties = await Collections.Property.find({
    realmId: realm._id
  }).lean();

  return properties.reduce((acc, property) => {
    property._id = String(property._id);
    acc[property._id] = property;
    return acc;
  }, {});
}

async function _fetchTenants(realmId, tenantId) {
  const $match = {
    realmId
  };
  if (tenantId) {
    $match._id = Collections.ObjectId(tenantId);
  }

  const tenants = await Collections.Tenant.aggregate([
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
                  { $in: ['$$tenant_leaseId', '$linkedResourceIds'] },
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
                        { $eq: ['$templateId', '$$template_templateId'] }
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
              linkedResourceIds: 0,
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
    {
      path: 'leaseId'
    },
    {
      path: 'properties.propertyId'
    }
  ]);

  // TODO: compute the missing doc property in mongodb
  const now = moment();
  tenants.forEach((tenant) =>
    tenant.filesToUpload?.forEach((fileToUpload) => {
      const { required, requiredOnceContractTerminated, documents } =
        fileToUpload;
      fileToUpload.missing =
        (required || (requiredOnceContractTerminated && tenant.terminated)) &&
        (!documents.length ||
          !documents.some(({ expiryDate }) =>
            expiryDate ? moment(expiryDate).isSameOrAfter(now) : true
          ));
    })
  );

  return tenants;
}

function _propertiesHaveRentData(properties) {
  return (
    properties?.length &&
    properties.every(
      ({ rent, entryDate, exitDate }) => rent && entryDate && exitDate
    )
  );
}

////////////////////////////////////////////////////////////////////////////////
// Exported functions
////////////////////////////////////////////////////////////////////////////////
export async function add(req, res) {
  const realm = req.realm;
  const { _id, ...occupant } = _formatTenant(req.body);

  if (!occupant.name) {
    logger.error('missing tenant name');
    throw new ServiceError('missing fields', 422);
  }

  const propertyMap = await _buildPropertyMap(realm);

  // Resolve proprerties
  occupant.properties?.forEach((property) => {
    property.property = propertyMap[property.propertyId];
    property.rent = property.rent || property.property.price;
    property.expenses =
      property.expenses ||
      (property.property.expense && [
        { title: 'general expense', amount: property.property.expense }
      ]) ||
      [];
  });

  // Build rents from contract
  try {
    occupant.rents = [];
    if (
      occupant.beginDate &&
      occupant.endDate &&
      _propertiesHaveRentData(occupant.properties)
    ) {
      const contract = Contract.create({
        begin: occupant.beginDate,
        end: occupant.endDate,
        frequency: occupant.frequency || 'months',
        properties: occupant.properties
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

  const occupants = await _fetchTenants(req.realm._id, newOccupant._id);
  res.json(FD.toOccupantData(occupants.length ? occupants[0] : null));
}

export async function update(req, res) {
  const realm = req.realm;
  const occupantId = req.params.id;
  const newOccupant = _formatTenant(req.body);

  if (!newOccupant.name) {
    logger.error('missing tenant name');
    throw new ServiceError('missing fields', 422);
  }

  const originalOccupant = await Collections.Tenant.findOne({
    _id: occupantId,
    realmId: realm._id
  }).lean();

  if (!originalOccupant) {
    throw new ServiceError('tenant not found', 404);
  }

  if (originalOccupant.documents) {
    newOccupant.documents = originalOccupant.documents;
  }

  const propertyMap = await _buildPropertyMap(realm);

  newOccupant.properties = newOccupant.properties.map((rentedProperty) => {
    // Merge properties from originalOccupant to newOccupant
    // copy property from db if not present in originalOccupant
    if (!rentedProperty.property) {
      const orignalProperty = originalOccupant.properties?.find(
        ({ propertyId }) => propertyId === rentedProperty.propertyId
      );

      rentedProperty.property =
        orignalProperty?.property || propertyMap[rentedProperty.propertyId];
    }

    return rentedProperty;
  });

  // Build rents from contract
  if (
    newOccupant.beginDate &&
    newOccupant.endDate &&
    _propertiesHaveRentData(newOccupant.properties)
  ) {
    try {
      const termFrequency = newOccupant.frequency || 'months';

      const contract = {
        begin: originalOccupant.beginDate,
        end: originalOccupant.endDate,
        frequency: termFrequency,
        terms: Math.ceil(
          moment(originalOccupant.endDate).diff(
            moment(originalOccupant.beginDate),
            termFrequency,
            true
          )
        ),
        properties: originalOccupant.properties,
        vatRate: originalOccupant.vatRatio,
        discount: originalOccupant.discount,
        rents: originalOccupant.rents
      };

      const modification = {
        begin: newOccupant.beginDate,
        end: newOccupant.endDate,
        termination: newOccupant.terminationDate,
        properties: newOccupant.properties,
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
    } catch (e) {
      throw new ServiceError(e, 409);
    }
  } else {
    const paidRents =
      newOccupant.rents?.some(
        (rent) =>
          (rent.payments &&
            rent.payments.some((payment) => payment.amount > 0)) ||
          rent.discounts.some((discount) => discount.origin === 'settlement')
      ) || [];

    if (paidRents.length) {
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
    newOccupant
  );

  const newOccupants = await _fetchTenants(req.realm._id, newOccupant._id);
  res.json(FD.toOccupantData(newOccupants.length ? newOccupants[0] : null));
}

export async function remove(req, res) {
  const realm = req.realm;
  const occupantIds = req.params?.ids.split(',') || [];

  if (!occupantIds.length) {
    throw new ServiceError('tenant not found', 404);
  }

  const occupants = await Collections.Tenant.find({
    realmId: realm._id,
    _id: { $in: occupantIds }
  });

  if (!occupants.length) {
    throw new ServiceError('tenant not found', 404);
  }

  const occupantsWithPaidRents = occupants.filter((occupant) => {
    return occupant.rents.some(
      (rent) =>
        (rent.payments &&
          rent.payments.some((payment) => payment.amount > 0)) ||
        rent.discounts.some((discount) => discount.origin === 'settlement')
    );
  });

  if (occupantsWithPaidRents.length) {
    throw new ServiceError(
      `impossible to remove ${occupantsWithPaidRents[0].name} some rents have been paid`,
      409
    );
  }

  const session = await Collections.startSession();
  session.startTransaction();
  try {
    // remove documents
    const documents = await Collections.Document.find(
      {
        realmId: realm._id,
        tenantId: { $in: occupantIds }
      },
      {
        _id: 1
      }
    );

    const { PDFGENERATOR_URL } = Service.getInstance().envConfig.getValues();
    const documentsEndPoint = `${PDFGENERATOR_URL}/documents/${documents
      .map(({ _id }) => _id)
      .join(',')}`;
    try {
      await axios.delete(documentsEndPoint, {
        headers: {
          authorization: req.headers.authorization,
          organizationid: req.headers.organizationid || String(req.realm._id),
          'Accept-Language': req.headers['accept-language']
        }
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      logger.error('DELETE documents failed');
      logger.error(errorMessage);
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
}

export async function all(req, res) {
  const tenants = await _fetchTenants(req.realm._id);
  res.json(tenants.map((tenant) => FD.toOccupantData(tenant)));
}

export async function one(req, res) {
  const occupantId = req.params.id;
  const tenants = await _fetchTenants(req.realm._id, occupantId);
  res.json(FD.toOccupantData(tenants.length ? tenants[0] : null));
}

export async function overview(req, res) {
  const realm = req.realm;
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
    const endMoment = moment(occupant.terminationDate || occupant.endDate);
    if (endMoment.isBefore(currentDate, 'day')) {
      acc.countInactive++;
    } else {
      acc.countActive++;
    }
    return acc;
  }, result);

  res.json(result);
}
