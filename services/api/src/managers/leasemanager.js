import { Collections, logger, ServiceError } from '@microrealestate/common';
import { createLog, diffObjects } from './auditlogmanager.js';

function _getUserFullName(req) {
  const u = req.user || {};
  return [u.firstname, u.lastname].filter(Boolean).join(' ') || u.email || '';
}

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

////////////////////////////////////////////////////////////////////////////////
// Exported functions
////////////////////////////////////////////////////////////////////////////////
export async function add(req, res) {
  const lease = req.body;
  if (!lease.name) {
    logger.error('missing lease name');
    throw new ServiceError('missing fields', 422);
  }

  const realm = req.realm;
  const lastUpdatedBy = _getUserFullName(req);
  const dbLease = new Collections.Lease({
    ...lease,
    active: !!lease.active && !!lease.numberOfTerms && !!lease.timeRange,
    realmId: realm._id,
    lastUpdatedBy
  });
  const savedLease = await dbLease.save();
  await createLog(req, 'create', 'lease', savedLease._id, lease.name || '');
  const setOfUsedLeases = await _leaseUsedByTenant(realm);
  savedLease.usedByTenants = setOfUsedLeases.has(savedLease._id);
  res.json(savedLease);
}

export async function update(req, res) {
  const realm = req.realm;
  const lease = req.body;

  if (!lease.name) {
    logger.error('missing lease name');
    throw new ServiceError('missing fields', 422);
  }

  if (lease.active === undefined) {
    lease.active = lease.numberOfTerms > 0 && !!lease.timeRange;
  }

  const lastUpdatedBy = _getUserFullName(req);
  const setOfUsedLeases = await _leaseUsedByTenant(realm);

  const oldLease = await Collections.Lease.findOne({
    realmId: realm._id,
    _id: lease._id
  }).lean();

  const updatePayload = setOfUsedLeases.has(lease._id)
    ? {
        name: lease.name || oldLease?.name,
        description: lease.description ?? oldLease?.description,
        active: lease.active ?? oldLease?.active,
        stepperMode: lease.stepperMode ?? oldLease?.stepperMode,
        lastUpdatedBy
      }
    : { ...lease, lastUpdatedBy };

  const dbLease = await Collections.Lease.findOneAndUpdate(
    {
      realmId: realm._id,
      _id: lease._id
    },
    updatePayload,
    { new: true }
  ).lean();

  if (!dbLease) {
    throw new ServiceError('lease not found', 404);
  }

  const changes = diffObjects(oldLease, lease);
  await createLog(
    req,
    'update',
    'lease',
    dbLease._id,
    dbLease.name || '',
    changes
  );

  dbLease.usedByTenants = setOfUsedLeases.has(dbLease._id);
  res.json(dbLease);
}

export async function remove(req, res) {
  const realm = req.realm;
  const leaseIds = req.params.ids.split(',') || [];

  if (!leaseIds.length) {
    logger.error('missing lease ids');
    throw new ServiceError('missing fields', 422);
  }

  const setOfUsedLeases = await _leaseUsedByTenant(realm);
  if (leaseIds.some((leaseId) => setOfUsedLeases.has(leaseId))) {
    logger.error('lease used by tenants and cannot be removed');
    throw new ServiceError('missing fields', 422);
  }

  const leases = await Collections.Lease.find({
    realmId: realm._id,
    _id: { $in: leaseIds }
  });

  if (!leases.length) {
    throw new ServiceError('lease not found', 404);
  }

  // Capture names before deletion for audit log
  const leaseNames = leases.reduce((acc, l) => {
    acc[String(l._id)] = l.name || '';
    return acc;
  }, {});

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
    await session.abortTransaction();
    throw new ServiceError(error, 500);
  } finally {
    session.endSession();
  }

  for (const leaseId of leaseIds) {
    await createLog(req, 'delete', 'lease', leaseId, leaseNames[leaseId] || '');
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
    throw new ServiceError('lease not found', 404);
  }

  const setOfUsedLeases = await _leaseUsedByTenant(realm);
  dbLease.usedByTenants = setOfUsedLeases.has(dbLease._id);
  res.json(dbLease);
}
