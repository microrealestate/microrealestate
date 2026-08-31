import {
  Collections,
  logger,
  type Middlewares,
  ServiceError
} from '@microrealestate/common';
import type { API } from '@microrealestate/shared';

async function _leaseUsedByTenant(
  realm: NonNullable<Express.Request['realm']>
): Promise<Set<string>> {
  const tenants = await Collections.Tenant.find(
    { realmId: realm._id },
    { realmId: 1, leaseId: 1 }
  ).lean();
  return tenants.reduce((acc, { leaseId }) => {
    acc.add(String(leaseId));
    return acc;
  }, new Set<string>());
}

////////////////////////////////////////////////////////////////////////////////
// Exported functions
////////////////////////////////////////////////////////////////////////////////
export const add: Middlewares.AsyncRequestHandler<
  API.Landlord.Lease.PostAddLease.RequestParams,
  API.Landlord.Lease.PostAddLease.ResponseBody,
  API.Landlord.Lease.PostAddLease.RequestBody
> = async (req, res) => {
  const lease = req.body;
  if (!lease.name) {
    logger.error('missing lease name');
    throw new ServiceError('missing fields', 422);
  }

  const realm = req.realm;
  if (!realm) throw new ServiceError('Realm not found', 500);

  const dbLease = new Collections.Lease({
    ...lease,
    active: !!lease.active && !!lease.numberOfTerms && !!lease.timeRange,
    realmId: realm._id
  });
  const savedLease = await dbLease.save();
  const setOfUsedLeases = await _leaseUsedByTenant(realm);
  res.json({
    ...savedLease.toObject(),
    _id: String(savedLease._id),
    realmId: String(realm._id),
    usedByTenants: setOfUsedLeases.has(String(savedLease._id))
  });
};

export const update: Middlewares.AsyncRequestHandler<
  API.Landlord.Lease.PutUpdateLease.RequestParams,
  API.Landlord.Lease.PutUpdateLease.ResponseBody,
  API.Landlord.Lease.PutUpdateLease.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) throw new ServiceError('Realm not found', 500);

  const lease = req.body;

  if (!lease.name) {
    logger.error('missing lease name');
    throw new ServiceError('missing fields', 422);
  }

  if (lease.active === undefined) {
    lease.active = (lease.numberOfTerms ?? 0) > 0 && !!lease.timeRange;
  }

  const setOfUsedLeases = await _leaseUsedByTenant(realm);

  let updatedLease: Partial<API.Landlord.Lease.PutUpdateLease.RequestBody> =
    lease;
  // if lease already used by tenants, only allow to update name, description, active fields
  if (setOfUsedLeases.has(lease._id)) {
    updatedLease = {};
    if (lease.name) {
      updatedLease.name = lease.name;
    }
    if (lease.description) {
      updatedLease.description = lease.description;
    }
    if (lease.active !== undefined) {
      updatedLease.active = lease.active;
    }
    if (lease.autoRenew !== undefined) {
      updatedLease.autoRenew = lease.autoRenew;
    }
    if (lease.stepperMode !== undefined) {
      updatedLease.stepperMode = lease.stepperMode;
    }
  }

  const dbLease = await Collections.Lease.findOneAndUpdate(
    {
      realmId: realm._id,
      _id: lease._id
    },
    updatedLease,
    { new: true }
  ).lean();

  if (!dbLease) {
    throw new ServiceError('lease not found', 404);
  }

  res.json({
    ...dbLease,
    _id: String(dbLease._id),
    realmId: String(dbLease.realmId),
    usedByTenants: setOfUsedLeases.has(String(dbLease._id))
  });
};

export const remove: Middlewares.AsyncRequestHandler<
  API.Landlord.Lease.DeleteRemoveLease.RequestParams,
  API.Landlord.Lease.DeleteRemoveLease.ResponseBody,
  API.Landlord.Lease.DeleteRemoveLease.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) throw new ServiceError('Realm not found', 500);

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
  })?.lean();

  if (!leases.length) {
    throw new ServiceError('lease not found', 404);
  }

  const templates = await Collections.Template.find({
    realmId: realm._id,
    relatesTo: { $in: leaseIds }
  })?.lean();

  const templateIdsToRemove = templates
    .filter(({ relatesTo }) => relatesTo.length <= 1)
    .reduce(
      (acc, { _id }) => {
        acc.push(_id);
        return acc;
      },
      [] as (typeof templates)[number]['_id'][]
    );

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
          relatesTo: { $in: leaseIds }
        },
        {
          // remove leaseIds from relatesTo
          $pull: { relatesTo: { $in: leaseIds } }
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
  res.sendStatus(200);
};

export const all: Middlewares.AsyncRequestHandler<
  API.Landlord.Lease.GetAllLeases.RequestParams,
  API.Landlord.Lease.GetAllLeases.ResponseBody,
  API.Landlord.Lease.GetAllLeases.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) throw new ServiceError('Realm not found', 500);

  const setOfUsedLeases = await _leaseUsedByTenant(realm);
  const dbLeases = await Collections.Lease.find({ realmId: realm._id })
    .sort({
      name: 1
    })
    .lean();

  res.json(
    dbLeases.map((dbLease) => ({
      ...dbLease,
      _id: String(dbLease._id),
      realmId: String(dbLease.realmId),
      usedByTenants: setOfUsedLeases.has(String(dbLease._id))
    }))
  );
};

export const one: Middlewares.AsyncRequestHandler<
  API.Landlord.Lease.GetOneLease.RequestParams,
  API.Landlord.Lease.GetOneLease.ResponseBody,
  API.Landlord.Lease.GetOneLease.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) throw new ServiceError('Realm not found', 500);

  const leaseId = req.params.id;

  const dbLease = await Collections.Lease.findOne({
    _id: leaseId,
    realmId: realm._id
  }).lean();

  if (!dbLease) {
    throw new ServiceError('lease not found', 404);
  }

  const setOfUsedLeases = await _leaseUsedByTenant(realm);
  res.json({
    ...dbLease,
    _id: String(dbLease._id),
    realmId: String(dbLease.realmId),
    usedByTenants: setOfUsedLeases.has(String(dbLease._id))
  });
};
