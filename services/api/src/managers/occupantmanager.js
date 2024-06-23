import * as Contract from './contract.js';
import * as FD from './frontdata.js';
import { Collections, Service } from '@microrealestate/common';
import axios from 'axios';
import { customAlphabet } from 'nanoid';
import documentModel from '../models/document.js';
import logger from 'winston';
import moment from 'moment';
import occupantModel from '../models/occupant.js';
import propertyModel from '../models/property.js';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 12);

function _buildPropertyMap(realm, callback) {
  propertyModel.findAll(realm, (errors, properties) => {
    const propertyMap = {};
    if (properties) {
      properties.reduce((acc, property) => {
        property._id = property._id.toString();
        acc[property._id] = property;
        return acc;
      }, propertyMap);
    }
    callback(errors, propertyMap);
  });
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

////////////////////////////////////////////////////////////////////////////////
// Exported functions
////////////////////////////////////////////////////////////////////////////////
export function add(req, res) {
  const realm = req.realm;
  const occupant = occupantModel.schema.filter(req.body);

  if (!occupant.isCompany) {
    occupant.company = null;
    occupant.legalForm = null;
    occupant.siret = null;
    occupant.capital = null;
    occupant.name = occupant.name || occupant.manager;
  } else {
    occupant.name = occupant.company;
  }

  occupant.reference = occupant.reference || nanoid();

  if (!occupant.name) {
    return res.status(422).json({
      errors: ['Missing tenant name']
    });
  }

  _buildPropertyMap(realm, (errors, propertyMap) => {
    if (errors && errors.length > 0) {
      return res.status(404).json({
        errors: errors
      });
    }

    // Resolve proprerties
    if (occupant.properties) {
      occupant.properties.forEach((item) => {
        item.property = propertyMap[item.propertyId];
        item.entryDate =
          (item.entryDate && moment(item.entryDate, 'DD/MM/YYYY').toDate()) ||
          occupant.beginDate;
        item.exitDate =
          (item.exitDate && moment(item.exitDate, 'DD/MM/YYYY').toDate()) ||
          occupant.endDate;
        item.rent = item.rent || item.property.price;
        item.expenses =
          item.expenses ||
          (item.property.expense && [
            { title: 'general expense', amount: item.property.expense }
          ]) ||
          [];
      });
    }

    // Build rents from contract
    occupant.rents = [];
    if (occupant.beginDate && occupant.endDate && occupant.properties) {
      const contract = Contract.create({
        begin: occupant.beginDate,
        end: occupant.endDate,
        frequency: occupant.frequency || 'months',
        properties: occupant.properties
      });

      occupant.rents = contract.rents;
    }

    occupantModel.add(realm, occupant, async (errors, occupant) => {
      if (errors) {
        return res.status(500).json({
          errors: errors
        });
      }
      const tenants = await _fetchTenants(req.realm._id, occupant._id);
      res.json(FD.toOccupantData(tenants.length ? tenants[0] : null));
    });
  });
}

export function update(req, res) {
  const realm = req.realm;
  const occupantId = req.params.id;
  const occupant = occupantModel.schema.filter(req.body);

  if (!occupant.isCompany) {
    occupant.company = null;
    occupant.legalForm = null;
    occupant.siret = null;
    occupant.capital = null;
    occupant.name = occupant.name || occupant.manager;
  } else {
    occupant.name = occupant.company;
  }

  occupant.reference = occupant.reference || nanoid();

  if (!occupant.name) {
    return res.status(422).json({
      errors: ['Missing tenant name']
    });
  }

  occupantModel.findOne(realm, occupantId, (errors, dbOccupant) => {
    if (errors && errors.length > 0) {
      return res.status(404).json({
        errors: errors
      });
    }

    if (dbOccupant.documents) {
      occupant.documents = dbOccupant.documents;
    }

    _buildPropertyMap(realm, (errors, propertyMap) => {
      if (errors && errors.length > 0) {
        return res.status(404).json({
          errors: errors
        });
      }

      // Resolve proprerties
      if (occupant.properties) {
        occupant.properties = occupant.properties.map((item) => {
          let itemToKeep;
          if (dbOccupant.properties) {
            dbOccupant.properties.forEach((dbItem) => {
              if (dbItem.propertyId === item.propertyId) {
                itemToKeep = dbItem;
                delete itemToKeep._id;
              }
            });
          }
          if (!itemToKeep) {
            itemToKeep = {
              propertyId: item.propertyId,
              property: propertyMap[item.propertyId]
            };
          }
          if (!itemToKeep.property) {
            itemToKeep.property = propertyMap[itemToKeep.propertyId];
          }
          itemToKeep.property._id = String(itemToKeep.property._id);
          itemToKeep.entryDate =
            (item.entryDate && moment(item.entryDate, 'DD/MM/YYYY').toDate()) ||
            occupant.beginDate;
          itemToKeep.exitDate =
            (item.exitDate && moment(item.exitDate, 'DD/MM/YYYY').toDate()) ||
            occupant.endDate;
          itemToKeep.rent = item.rent || itemToKeep.property.price;
          itemToKeep.expenses =
            item.expenses ||
            (itemToKeep.property.expense && [
              { title: 'general expense', amount: itemToKeep.property.expense }
            ]) ||
            [];
          return itemToKeep;
        });
      }

      // Build rents from contract
      occupant.rents = [];
      if (
        occupant.beginDate &&
        occupant.endDate &&
        occupant.properties?.length
      ) {
        try {
          const contract = {
            begin: dbOccupant.beginDate,
            end: dbOccupant.endDate,
            frequency: occupant.frequency || 'months',
            terms: Math.ceil(
              moment(dbOccupant.endDate).diff(
                moment(dbOccupant.beginDate),
                'months',
                true
              )
            ),
            properties: dbOccupant.properties,
            vatRate: dbOccupant.vatRatio,
            discount: dbOccupant.discount,
            rents: dbOccupant.rents
          };

          const modification = {
            begin: occupant.beginDate,
            end: occupant.endDate,
            termination: occupant.terminationDate,
            properties: occupant.properties,
            frequency: occupant.frequency || 'months'
          };
          if (occupant.vatRatio !== undefined) {
            modification.vatRate = occupant.vatRatio;
          }
          if (occupant.discount !== undefined) {
            modification.discount = occupant.discount;
          }

          const newContract = Contract.update(contract, modification);
          occupant.rents = newContract.rents;
        } catch (e) {
          logger.error(e);
          return res.sendStatus(500);
        }
      }

      occupantModel.update(realm, occupant, async (errors) => {
        if (errors) {
          return res.status(500).json({
            errors: errors
          });
        }

        const tenants = await _fetchTenants(req.realm._id, occupant._id);
        res.json(FD.toOccupantData(tenants.length ? tenants[0] : null));
      });
    });
  });
}

export async function remove(req, res) {
  const realm = req.realm;
  const occupantIds = req.params?.ids.split(',') || [];

  if (!occupantIds.length) {
    return res.sendStatus(404);
  }

  try {
    const occupants = await new Promise((resolve, reject) => {
      occupantModel.findFilter(
        realm,
        {
          $query: {
            $or: occupantIds.map((_id) => {
              return { _id };
            })
          }
        },
        (errors, occupants) => {
          if (errors) {
            return reject({
              errors
            });
          }

          resolve(occupants || []);
        }
      );
    });

    if (!occupants.length) {
      return res.sendStatus(404);
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
      return res.status(422).json({
        errors: [
          `impossible to remove ${occupantsWithPaidRents[0].name}. Rents have been recorded.`
        ]
      });
    }

    // remove documents
    try {
      const documents = await new Promise((resolve, reject) => {
        documentModel.findAll(realm, async (errors, dbDocuments) => {
          if (errors && errors.length > 0) {
            return reject({
              errors: errors
            });
          }
          resolve(
            dbDocuments?.filter((document) =>
              occupantIds.includes(document.tenantId)
            ) || []
          );
        });
      });

      const { PDFGENERATOR_URL } = Service.getInstance().envConfig.getValues();
      const documentsEndPoint = `${PDFGENERATOR_URL}/documents/${documents
        .map(({ _id }) => _id)
        .join(',')}`;

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

    await new Promise((resolve, reject) => {
      occupantModel.remove(
        realm,
        occupants.map((occupant) => occupant._id.toString()),
        (errors) => {
          if (errors) {
            return reject({
              errors
            });
          }
          resolve();
        }
      );
    });

    res.sendStatus(200);
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      errors: ['a problem occured when deleting tenants']
    });
  }
}

export async function all(req, res) {
  try {
    const tenants = await _fetchTenants(req.realm._id);
    res.json(tenants.map((tenant) => FD.toOccupantData(tenant)));
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      errors: ['an error occurred when fetching the tenants in db']
    });
  }
}

export async function one(req, res) {
  const occupantId = req.params.id;
  try {
    const tenants = await _fetchTenants(req.realm._id, occupantId);
    res.json(FD.toOccupantData(tenants.length ? tenants[0] : null));
  } catch (error) {
    return res.status(500).json({
      errors: ['an error occurred when fetching a tenant from db']
    });
  }
}

export function overview(req, res) {
  const realm = req.realm;
  let result = {
    countAll: 0,
    countActive: 0,
    countInactive: 0
  };
  const currentDate = moment();

  occupantModel.findAll(realm, (errors, occupants) => {
    if (errors && errors.length > 0) {
      return res.status(404).json({
        errors: errors
      });
    }

    if (occupants) {
      result.countAll = occupants.length;
      result = occupants.reduce((acc, occupant) => {
        const endMoment = moment(occupant.terminationDate || occupant.endDate);
        if (endMoment.isBefore(currentDate, 'day')) {
          acc.countInactive++;
        } else {
          acc.countActive++;
        }
        return acc;
      }, result);
    }
    res.json(result);
  });
}
