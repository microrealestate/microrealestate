import leaseModel from '../models/lease.js';
import logger from 'winston';
import occupantModel from '../models/occupant.js';
import templateModel from '../models/template.js';

/**
 * @returns a Set of leaseId (_id)
 */
async function _leaseUsedByTenant(realm) {
  return await new Promise((resolve, reject) => {
    occupantModel.findAll(realm, (errors, occupants) => {
      if (errors && errors.length > 0) {
        return reject(errors);
      }

      resolve(
        occupants.reduce((acc, { leaseId }) => {
          acc.add(leaseId);
          return acc;
        }, new Set())
      );
    });
  });
}

function _rejectMissingFields(lease, res) {
  if (!lease.name) {
    res.status(422).json({
      errors: ['"name" field is required']
    });
    return true;
  }
  return false;
}

////////////////////////////////////////////////////////////////////////////////
// Exported functions
////////////////////////////////////////////////////////////////////////////////
export function add(req, res) {
  const realm = req.realm;
  const lease = leaseModel.schema.filter(req.body);

  if (_rejectMissingFields(lease, res)) {
    return;
  }
  delete lease._id;

  leaseModel.add(
    realm,
    {
      ...lease,
      active: !!lease.active && !!lease.numberOfTerms && !!lease.timeRange
    },
    async (errors, dbLease) => {
      if (errors) {
        return res.status(500).json({
          errors: errors
        });
      }
      const setOfUsedLeases = await _leaseUsedByTenant(realm);
      dbLease.usedByTenants = setOfUsedLeases.has(dbLease._id);
      res.json(dbLease);
    }
  );
}

export async function update(req, res) {
  const realm = req.realm;
  let lease = leaseModel.schema.filter(req.body);

  if (_rejectMissingFields(lease, res)) {
    return;
  }

  const setOfUsedLeases = await _leaseUsedByTenant(realm);
  if (setOfUsedLeases.has(lease._id)) {
    // if lease already used by tenants, only allow to update name, description, active fields
    const dbLease = await new Promise((resolve /*, reject*/) => {
      leaseModel.findOne(realm, lease._id, async (errors, dbLease) => {
        if (errors && errors.length > 0) {
          logger.error(errors);
          return resolve();
        }
        resolve(dbLease);
      });
    });
    if (!dbLease) {
      return res.sendStatus(404);
    }
    lease = {
      ...dbLease,
      name: lease.name || dbLease.name,
      description: lease.description ?? dbLease.description,
      active: lease.active ?? dbLease.active,
      stepperMode: lease.stepperMode ?? dbLease.stepperMode
    };
  }

  if (!lease.active) {
    lease.active = lease.numberOfTerms > 0 && !!lease.timeRange;
  }

  leaseModel.update(realm, lease, (errors, dbLease) => {
    if (errors) {
      return res.status(500).json({
        errors: errors
      });
    }
    dbLease.usedByTenants = setOfUsedLeases.has(lease._id);
    res.json(dbLease);
  });
}

export async function remove(req, res) {
  const realm = req.realm;
  const leaseIds = req.params.ids.split(',') || [];

  if (!leaseIds.length) {
    return res.sendStatus(404);
  }

  try {
    const setOfUsedLeases = await _leaseUsedByTenant(realm);
    if (leaseIds.some((lease) => setOfUsedLeases.has(lease._id))) {
      return res.status(422).json({
        errors: ['One lease is used by tenants. It cannot be removed']
      });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      errors: ['a problem occured when deleting leases']
    });
  }

  try {
    const leases = await new Promise((resolve, reject) => {
      leaseModel.findAll(realm, async (errors, dbLeases) => {
        if (errors && errors.length > 0) {
          return reject({
            errors: errors
          });
        }

        resolve(
          dbLeases?.filter((lease) => leaseIds.includes(lease._id)) || []
        );
      });
    });

    if (!leases.length) {
      return res.sendStatus(404);
    }

    const templates = await new Promise((resolve, reject) => {
      templateModel.findAll(realm, async (errors, dbTemplates) => {
        if (errors && errors.length > 0) {
          return reject({
            errors: errors
          });
        }

        resolve(
          dbTemplates?.filter(
            ({ linkedResourceIds = [] }) =>
              !!leases.filter(({ _id }) => linkedResourceIds.includes(_id))
                .length
          ) || []
        );
      });
    });
    logger.debug(
      templates.filter(({ linkedResourceIds }) => linkedResourceIds.length <= 1)
    );

    const templateIdsToRemove = templates
      .filter(({ linkedResourceIds }) => linkedResourceIds.length <= 1)
      .reduce((acc, { _id }) => [...acc, _id], []);

    const templatesToUpdate = templates.filter(
      ({ linkedResourceIds }) => linkedResourceIds.length > 1
    );

    await Promise.all([
      // remove leases
      new Promise((resolve, reject) => {
        leaseModel.remove(
          realm,
          leases.map(({ _id }) => _id),
          (errors) => {
            if (errors) {
              return reject({
                errors
              });
            }
            resolve();
          }
        );
      }),
      ...(templateIdsToRemove.length
        ? [
            new Promise((resolve, reject) => {
              templateModel.remove(realm, templateIdsToRemove, (errors) => {
                if (errors) {
                  return reject({
                    errors
                  });
                }
                resolve();
              });
            })
          ]
        : []),
      ...(templatesToUpdate.length
        ? templatesToUpdate.map((template) => {
            template.linkedResourceIds = template.linkedResourceIds.filter(
              (_id) => !leaseIds.includes(_id)
            );
            return new Promise((resolve, reject) => {
              templateModel.update(realm, template, (errors) => {
                if (errors) {
                  return reject({
                    errors
                  });
                }
                resolve();
              });
            });
          })
        : [])
    ]);
    res.sendStatus(200);
  } catch (error) {
    logger.error(error);
    res.status(500).json(error);
  }
}

export function all(req, res) {
  const realm = req.realm;
  leaseModel.findAll(realm, async (errors, dbLeases) => {
    if (errors && errors.length > 0) {
      return res.status(500).json({
        errors: errors
      });
    }
    const setOfUsedLeases = await _leaseUsedByTenant(realm);
    const allLeases = dbLeases.map((dbLease) => ({
      ...dbLease,
      usedByTenants: setOfUsedLeases.has(dbLease._id)
    }));

    res.json(allLeases.sort((l1, l2) => l1.name?.localeCompare(l2.name)));
  });
}

export function one(req, res) {
  const realm = req.realm;
  const leaseId = req.params.id;
  leaseModel.findOne(realm, leaseId, async (errors, dbLease) => {
    if (errors && errors.length > 0) {
      return res.status(404).json({
        errors: errors
      });
    }
    const setOfUsedLeases = await _leaseUsedByTenant(realm);
    dbLease.usedByTenants = setOfUsedLeases.has(dbLease._id);
    res.json(dbLease);
  });
}
