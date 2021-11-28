const logger = require('winston');
const { customAlphabet } = require('nanoid');
const moment = require('moment');
const FD = require('./frontdata');
const Contract = require('./contract');
const occupantModel = require('../models/occupant');
const propertyModel = require('../models/property');
const documentModel = require('../models/document');

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

////////////////////////////////////////////////////////////////////////////////
// Exported functions
////////////////////////////////////////////////////////////////////////////////
function add(req, res) {
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
      errors: ['Missing tenant name'],
    });
  }

  _buildPropertyMap(realm, (errors, propertyMap) => {
    if (errors && errors.length > 0) {
      return res.status(404).json({
        errors: errors,
      });
    }

    // Resolve proprerties
    if (occupant.properties) {
      occupant.properties.forEach((item) => {
        item.property = propertyMap[item.propertyId];
        item.entryDate = item.entryDate || occupant.beginDate;
        item.exitDate = item.exitDate || occupant.endDate;
        item.rent = item.rent || item.property.price;
        item.expenses =
          item.expenses ||
          (item.property.expense && [
            { title: 'general expense', amount: item.property.expense },
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
        properties: occupant.properties,
      });

      occupant.rents = contract.rents;
    }

    occupantModel.add(realm, occupant, (errors, occupant) => {
      if (errors) {
        return res.status(500).json({
          errors: errors,
        });
      }
      res.json(FD.toOccupantData(occupant));
    });
  });
}

function update(req, res) {
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
      errors: ['Missing tenant name'],
    });
  }

  occupantModel.findOne(realm, occupantId, (errors, dbOccupant) => {
    if (errors && errors.length > 0) {
      return res.status(404).json({
        errors: errors,
      });
    }

    if (dbOccupant.documents) {
      occupant.documents = dbOccupant.documents;
    }

    _buildPropertyMap(realm, (errors, propertyMap) => {
      if (errors && errors.length > 0) {
        return res.status(404).json({
          errors: errors,
        });
      }

      // Resolve proprerties
      if (occupant.properties) {
        occupant.properties = occupant.properties.map((item) => {
          let itemToKeep;
          if (dbOccupant.properties) {
            dbOccupant.properties.forEach((dbItem) => {
              if (dbItem.propertyId === item.propertyId) {
                dbItem.property._id = dbItem.property._id.toString();
                itemToKeep = dbItem;
              }
            });
          }
          if (!itemToKeep) {
            itemToKeep = {
              propertyId: item.propertyId,
              property: propertyMap[item.propertyId],
            };
          }
          itemToKeep.entryDate = item.entryDate || occupant.beginDate;
          itemToKeep.exitDate = item.exitDate || occupant.endDate;
          itemToKeep.rent = item.rent || itemToKeep.property.price;
          itemToKeep.expenses =
            item.expenses ||
            (itemToKeep.property.expense && [
              { title: 'general expense', amount: itemToKeep.property.expense },
            ]) ||
            [];
          return itemToKeep;
        });
      }

      // Build rents from contract
      occupant.rents = [];
      if (occupant.beginDate && occupant.endDate && occupant.properties) {
        try {
          const contract = {
            begin: dbOccupant.beginDate,
            end: dbOccupant.endDate,
            frequency: occupant.frequency || 'months',
            terms: Math.ceil(
              moment(dbOccupant.endDate, 'DD/MM/YYYY').diff(
                moment(dbOccupant.beginDate, 'DD/MM/YYYY'),
                'months',
                true
              )
            ),
            properties: dbOccupant.properties,
            vatRate: dbOccupant.vatRatio,
            discount: dbOccupant.discount,
            rents: dbOccupant.rents,
          };

          const modification = {
            begin: occupant.beginDate,
            end: occupant.endDate,
            termination: occupant.terminationDate,
            properties: occupant.properties,
            frequency: occupant.frequency,
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

      occupantModel.update(realm, occupant, (errors) => {
        if (errors) {
          return res.status(500).json({
            errors: errors,
          });
        }
        res.json(FD.toOccupantData(occupant));
      });
    });
  });
}

async function remove(req, res) {
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
            }),
          },
        },
        (errors, occupants) => {
          if (errors) {
            return reject({
              errors,
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
          `impossible to remove ${occupantsWithPaidRents[0].name}. Rents have been recorded.`,
        ],
      });
    }

    const documents = await new Promise((resolve, reject) => {
      documentModel.findAll(realm, async (errors, dbDocuments) => {
        if (errors && errors.length > 0) {
          return reject({
            errors: errors,
          });
        }
        resolve(
          dbDocuments?.filter((document) =>
            occupantIds.includes(document.tenantId)
          ) || []
        );
      });
    });

    await Promise.all([
      ...(documents.length
        ? [
            new Promise((resolve, reject) => {
              documentModel.remove(
                realm,
                documents.map(({ _id }) => _id),
                (errors) => {
                  if (errors) {
                    return reject({
                      errors,
                    });
                  }
                  resolve();
                }
              );
            }),
          ]
        : []),
      new Promise((resolve, reject) => {
        occupantModel.remove(
          realm,
          occupants.map((occupant) => occupant._id.toString()),
          (errors) => {
            if (errors) {
              return reject({
                errors,
              });
            }
            resolve();
          }
        );
      }),
    ]);

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      errors: ['a problem occured when deleting occupants'],
    });
  }
}

function all(req, res) {
  const realm = req.realm;
  occupantModel.findAll(realm, (errors, occupants) => {
    if (errors && errors.length > 0) {
      return res.status(500).json({
        errors: errors,
      });
    }

    res.json(occupants.map((occupant) => FD.toOccupantData(occupant)));
  });
}

function one(req, res) {
  const realm = req.realm;
  const occupantId = req.params.id;
  occupantModel.findOne(realm, occupantId, (errors, dbOccupant) => {
    if (errors && errors.length > 0) {
      return res.status(404).json({
        errors: errors,
      });
    }

    res.json(FD.toOccupantData(dbOccupant));
  });
}

function overview(req, res) {
  const realm = req.realm;
  let result = {
    countAll: 0,
    countActive: 0,
    countInactive: 0,
  };
  const currentDate = moment();

  occupantModel.findAll(realm, (errors, occupants) => {
    if (errors && errors.length > 0) {
      return res.status(404).json({
        errors: errors,
      });
    }

    if (occupants) {
      result.countAll = occupants.length;
      result = occupants.reduce((acc, occupant) => {
        const endMoment = moment(
          occupant.terminationDate || occupant.endDate,
          'DD/MM/YYYY'
        );
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

module.exports = {
  add,
  update,
  remove,
  one,
  all,
  overview,
};
