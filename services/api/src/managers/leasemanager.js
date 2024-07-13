import { Collections, logger } from '@microrealestate/common';

/**
 * @returns a Set of leaseId (_id)
 */
async function _leaseUsedByTenant(realm) {
  const tenants = await Collections.Tenant.find(
    { realmId: realm._id },
    { realmId: 1, leaseId: 1 }
  ).lean();
  return tenants.reduce((acc, { leaseId }) => {
    acc.add(leaseId);
    return acc;
  }, new Set());
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
export async function add(req, res) {
  if (_rejectMissingFields(req.body, res)) {
    return;
  }

  const realm = req.realm;
  const lease = new Collections.Lease({
    ...req.body,
    active:
      !!req.body.active && !!req.body.numberOfTerms && !!req.body.timeRange,
    realmId: realm._id
  });
  const savedLease = await lease.save();
  const setOfUsedLeases = await _leaseUsedByTenant(realm);
  savedLease.usedByTenants = setOfUsedLeases.has(savedLease._id);
  res.json(savedLease);
}

export async function update(req, res) {
  const realm = req.realm;
  const lease = req.body;

  if (_rejectMissingFields(lease, res)) {
    return;
  }

  if (lease.active === undefined) {
    lease.active = lease.numberOfTerms > 0 && !!lease.timeRange;
  }

  const setOfUsedLeases = await _leaseUsedByTenant(realm);

  const dbLease = await Collections.Lease.findOneAndUpdate(
    {
      realmId: realm._id,
      _id: lease._id
    },
    // if lease already used by tenants, only allow to update name, description, active fields
    setOfUsedLeases.has(lease._id)
      ? {
          name: lease.name || dbLease.name,
          description: lease.description ?? dbLease.description,
          active: lease.active ?? dbLease.active,
          stepperMode: lease.stepperMode ?? dbLease.stepperMode
        }
      : lease,
    { new: true }
  ).lean();

  if (!dbLease) {
    return res.sendStatus(404);
  }

  dbLease.usedByTenants = setOfUsedLeases.has(dbLease._id);
  res.json(dbLease);
}

export async function remove(req, res) {
  const realm = req.realm;
  const leaseIds = req.params.ids.split(',') || [];

  if (!leaseIds.length) {
    return res.sendStatus(404);
  }

  const setOfUsedLeases = await _leaseUsedByTenant(realm);
  if (leaseIds.some((leaseId) => setOfUsedLeases.has(leaseId))) {
    return res.status(422).json({
      errors: ['One lease is used by tenants. It cannot be removed']
    });
  }

  const leases = await Collections.Lease.find({
    realmId: realm._id,
    _id: { $in: leaseIds }
  });

  if (!leases.length) {
    return res.sendStatus(404);
  }

  const templates = await Collections.Template.find({
    realmId: realm._id,
    linkedResourceIds: { $in: leaseIds }
  });

  const templateIdsToRemove = templates
    .filter(({ linkedResourceIds }) => linkedResourceIds.length <= 1)
    .reduce((acc, { _id }) => [...acc, _id], []);

  const session = await Collections.startSession();
  session.startTransaction();
  try {
    await Promise.all([
      Collections.Lease.deleteMany({
        _id: { $in: leaseIds },
        realmId: realm._id
      }),
      Collections.Template.deleteMany({
        _id: { $in: templateIdsToRemove },
        realmId: realm._id
      }),
      Collections.Template.updateMany(
        {
          realmId: realm._id,
          linkedResourceIds: { $in: leaseIds }
        },
        {
          // remove leaseIds from linkedResourceIds
          $pull: { linkedResourceIds: { $in: leaseIds } }
        }
      )
    ]);
    await session.commitTransaction();
  } catch (error) {
    logger.error(error);
    await session.abortTransaction();
    return res.sendStatus(500);
  } finally {
    session.endSession();
  }
  res.sendStatus(200);
}

export async function all(req, res) {
  const realm = req.realm;
  const setOfUsedLeases = await _leaseUsedByTenant(realm);
  const dbLeases = await Collections.Lease.find({ realmId: realm._id })
    .sort({
      name: 1
    })
    .lean();

  res.json(
    dbLeases.map((dbLease) => ({
      ...dbLease,
      usedByTenants: setOfUsedLeases.has(dbLease._id)
    }))
  );
}

export async function one(req, res) {
  const realm = req.realm;
  const leaseId = req.params.id;

  const dbLease = await Collections.Lease.findOne({
    _id: leaseId,
    realmId: realm._id
  }).lean();

  if (!dbLease) {
    return res.sendStatus(404);
  }

  const setOfUsedLeases = await _leaseUsedByTenant(realm);
  dbLease.usedByTenants = setOfUsedLeases.has(dbLease._id);
  res.json(dbLease);
}
