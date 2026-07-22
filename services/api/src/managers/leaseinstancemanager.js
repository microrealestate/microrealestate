/**
 * Lease Instance Manager
 *
 * Handles the full lifecycle of a LeaseInstance:
 *   draft  →  active  →  expired
 *
 * A LeaseInstance is an actual lease record (NOT a lease template).
 * The existing `Lease` model remains the template used by the rent-generation
 * workflow and is untouched by this module.
 *
 * Key design decisions:
 *  - Only `active` leases enforce property date-range conflicts.
 *  - `draft` leases may freely overlap — they do not block any property.
 *  - Expiration is reconciled on read AND via a scheduled job trigger.
 *  - Validation for activation requires: startDate, endDate, ≥1 tenant,
 *    propertyId, and signedDocumentId.
 */

import { Collections, logger, ServiceError } from '@microrealestate/common';
import moment from 'moment';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _getUserFullName(req) {
  const u = req.user || {};
  return [u.firstname, u.lastname].filter(Boolean).join(' ') || u.email || '';
}

/**
 * Auto-expire any leases whose endDate has passed without being manually expired.
 * Returns the count of leases updated.
 */
async function _reconcileExpired(realmId) {
  const result = await Collections.LeaseInstance.updateMany(
    {
      realmId,
      status: 'active',
      endDate: { $lt: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
  return result.modifiedCount || 0;
}

/**
 * Check whether an active lease for `propertyId` already covers [startDate, endDate].
 * Two ranges overlap when:  proposedStart < existingEnd  AND  proposedEnd > existingStart
 *
 * @param {string} realmId
 * @param {string} propertyId
 * @param {Date}   startDate
 * @param {Date}   endDate
 * @param {string} [excludeLeaseId]  – exclude the current lease (for updates)
 * @returns {Promise<CollectionTypes.LeaseInstance|null>}
 */
async function _findOverlap(realmId, propertyId, startDate, endDate, excludeLeaseId) {
  const query = {
    realmId,
    propertyId: String(propertyId),
    status: 'active',
    // Overlap condition: existing.startDate < proposedEnd AND existing.endDate > proposedStart
    startDate: { $lt: endDate },
    endDate: { $gt: startDate }
  };

  if (excludeLeaseId) {
    query._id = { $ne: excludeLeaseId };
  }

  return Collections.LeaseInstance.findOne(query).lean();
}

/**
 * Validate that all required fields are present before activating a lease.
 * Returns a list of validation error messages (empty = valid).
 */
function _validateForActivation(lease) {
  const errors = [];

  if (!lease.startDate) {
    errors.push('startDate is required before activating a lease');
  }
  if (!lease.endDate) {
    errors.push('endDate is required before activating a lease');
  }
  if (lease.startDate && lease.endDate && moment(lease.startDate).isSameOrAfter(moment(lease.endDate))) {
    errors.push('startDate must be before endDate');
  }
  if (!lease.tenantIds || lease.tenantIds.length === 0) {
    errors.push('at least one tenant must be assigned before activating a lease');
  }
  if (!lease.propertyId) {
    errors.push('a property or unit must be assigned before activating a lease');
  }

  return errors;
}

// ─── Exported route handlers ──────────────────────────────────────────────────

/**
 * POST /lease-instances
 * Create a new lease instance in `draft` status.
 */
export async function create(req, res) {
  const realm = req.realm;
  const lastUpdatedBy = _getUserFullName(req);

  const {
    startDate,
    endDate,
    tenantIds = [],
    propertyId,
    draftDocumentIds = [],
    signedDocumentId,
    notes = '',
    invoiceEmail
  } = req.body;

  // Validate tenants exist in realm (if provided)
  if (tenantIds.length > 0) {
    const tenantCount = await Collections.Tenant.countDocuments({
      _id: { $in: tenantIds },
      realmId: realm._id
    });
    if (tenantCount !== tenantIds.length) {
      throw new ServiceError('one or more tenantIds not found in this organization', 422);
    }
  }

  // Validate property exists in realm (if provided)
  if (propertyId) {
    const propertyExists = await Collections.Property.exists({
      _id: propertyId,
      realmId: realm._id
    });
    if (!propertyExists) {
      throw new ServiceError('propertyId not found in this organization', 422);
    }
  }

  const leaseInstance = await Collections.LeaseInstance.create({
    realmId: realm._id,
    status: 'draft',
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    tenantIds: tenantIds.map(String),
    propertyId: propertyId ? String(propertyId) : null,
    draftDocumentIds: draftDocumentIds.map(String),
    signedDocumentId: signedDocumentId ? String(signedDocumentId) : null,
    notes: notes || '',
    invoiceEmail: invoiceEmail || null,
    lastUpdatedBy
  });

  return res.status(201).json(leaseInstance);
}

/**
 * PATCH /lease-instances/:id
 * Update a draft lease instance (fields, tenants, property, documents).
 * Active or expired leases can only update `notes` and `invoiceEmail`.
 */
export async function update(req, res) {
  const realm = req.realm;
  const leaseId = req.params.id;
  const lastUpdatedBy = _getUserFullName(req);

  const existing = await Collections.LeaseInstance.findOne({
    _id: leaseId,
    realmId: realm._id
  }).lean();

  if (!existing) {
    throw new ServiceError('lease instance not found', 404);
  }

  // Reconcile expiration first (edge case: endDate passed since last read)
  if (existing.status === 'active' && existing.endDate && new Date(existing.endDate) < new Date()) {
    await Collections.LeaseInstance.updateOne({ _id: leaseId }, { $set: { status: 'expired' } });
    throw new ServiceError('this lease has expired and cannot be modified', 409);
  }

  const allowedFields = {};
  const {
    startDate,
    endDate,
    tenantIds,
    propertyId,
    draftDocumentIds,
    signedDocumentId,
    notes,
    invoiceEmail
  } = req.body;

  if (existing.status === 'draft') {
    // Draft leases: all fields editable
    if (startDate !== undefined) allowedFields.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) allowedFields.endDate = endDate ? new Date(endDate) : null;

    if (tenantIds !== undefined) {
      if (tenantIds.length > 0) {
        const tenantCount = await Collections.Tenant.countDocuments({
          _id: { $in: tenantIds },
          realmId: realm._id
        });
        if (tenantCount !== tenantIds.length) {
          throw new ServiceError('one or more tenantIds not found in this organization', 422);
        }
      }
      allowedFields.tenantIds = tenantIds.map(String);
    }

    if (propertyId !== undefined) {
      if (propertyId) {
        const propertyExists = await Collections.Property.exists({
          _id: propertyId,
          realmId: realm._id
        });
        if (!propertyExists) {
          throw new ServiceError('propertyId not found in this organization', 422);
        }
      }
      allowedFields.propertyId = propertyId ? String(propertyId) : null;
    }

    if (draftDocumentIds !== undefined) {
      allowedFields.draftDocumentIds = draftDocumentIds.map(String);
    }
    if (signedDocumentId !== undefined) {
      allowedFields.signedDocumentId = signedDocumentId ? String(signedDocumentId) : null;
    }
  } else if (existing.status === 'active') {
    // Active leases: only metadata editable
    logger.info(`lease ${leaseId} is active; only notes/invoiceEmail will be updated`);
  }

  // Notes and invoiceEmail editable in all non-expired statuses
  if (notes !== undefined) allowedFields.notes = notes || '';
  if (invoiceEmail !== undefined) allowedFields.invoiceEmail = invoiceEmail || null;

  allowedFields.lastUpdatedBy = lastUpdatedBy;

  const updated = await Collections.LeaseInstance.findOneAndUpdate(
    { _id: leaseId, realmId: realm._id },
    { $set: allowedFields },
    { new: true }
  ).lean();

  if (!updated) {
    throw new ServiceError('lease instance not found', 404);
  }

  return res.json(updated);
}

/**
 * POST /lease-instances/:id/activate
 * Transition a draft lease to active.
 *
 * Validation:
 *  - All required fields must be set (startDate, endDate, tenants, property, signedDoc)
 *  - No other ACTIVE lease for the same property may have an overlapping date range
 */
export async function activate(req, res) {
  const realm = req.realm;
  const leaseId = req.params.id;
  const lastUpdatedBy = _getUserFullName(req);

  // Reconcile expired leases first to ensure accurate conflict detection
  await _reconcileExpired(realm._id);

  const lease = await Collections.LeaseInstance.findOne({
    _id: leaseId,
    realmId: realm._id
  }).lean();

  if (!lease) {
    throw new ServiceError('lease instance not found', 404);
  }

  if (lease.status !== 'draft') {
    throw new ServiceError(
      `lease instance is already '${lease.status}' and cannot be activated`,
      409
    );
  }

  // Merge optional activation-time overrides (e.g., final date set at signing)
  const { startDate, endDate, signedDocumentId } = req.body;
  if (startDate) lease.startDate = new Date(startDate);
  if (endDate) lease.endDate = new Date(endDate);
  if (signedDocumentId) lease.signedDocumentId = String(signedDocumentId);

  // Validate required fields
  const errors = _validateForActivation(lease);
  if (errors.length > 0) {
    return res.status(422).json({ message: 'Lease cannot be activated', errors });
  }

  // ── Overlap check ─────────────────────────────────────────────────────────
  const conflicting = await _findOverlap(
    realm._id,
    lease.propertyId,
    lease.startDate,
    lease.endDate,
    leaseId
  );

  if (conflicting) {
    return res.status(409).json({
      message: 'An active lease already exists for this property during the requested period',
      conflictingLeaseId: String(conflicting._id),
      conflictingPeriod: {
        startDate: conflicting.startDate,
        endDate: conflicting.endDate
      }
    });
  }

  // ── Activate ──────────────────────────────────────────────────────────────
  const updated = await Collections.LeaseInstance.findOneAndUpdate(
    { _id: leaseId, realmId: realm._id },
    {
      $set: {
        status: 'active',
        activatedAt: new Date(),
        startDate: lease.startDate,
        endDate: lease.endDate,
        signedDocumentId: lease.signedDocumentId,
        lastUpdatedBy
      }
    },
    { new: true }
  ).lean();

  if (!updated) {
    throw new ServiceError('lease instance not found', 404);
  }

  return res.json(updated);
}

/**
 * POST /lease-instances/reconcile-expired
 * Manually trigger expiration reconciliation for the caller's realm.
 * In production this is typically called by a scheduled job.
 */
export async function reconcileExpired(req, res) {
  const realm = req.realm;
  const count = await _reconcileExpired(realm._id);
  return res.json({ expiredCount: count });
}

/**
 * GET /lease-instances
 * List lease instances with optional filters.
 * Query params: status, propertyId, tenantId
 */
export async function all(req, res) {
  const realm = req.realm;
  const { status, propertyId, tenantId } = req.query;

  // Reconcile expired on list so the caller always sees accurate status
  await _reconcileExpired(realm._id);

  const query = { realmId: realm._id };
  if (status) query.status = status;
  if (propertyId) query.propertyId = String(propertyId);
  if (tenantId) query.tenantIds = tenantId;

  const leases = await Collections.LeaseInstance.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return res.json(leases);
}

/**
 * GET /lease-instances/:id
 */
export async function one(req, res) {
  const realm = req.realm;
  const leaseId = req.params.id;

  const lease = await Collections.LeaseInstance.findOne({
    _id: leaseId,
    realmId: realm._id
  }).lean();

  if (!lease) {
    throw new ServiceError('lease instance not found', 404);
  }

  // Reconcile expiration on read
  if (lease.status === 'active' && lease.endDate && new Date(lease.endDate) < new Date()) {
    await Collections.LeaseInstance.updateOne({ _id: leaseId }, { $set: { status: 'expired' } });
    lease.status = 'expired';
  }

  return res.json(lease);
}

/**
 * DELETE /lease-instances/:id
 * Only draft leases can be deleted. Active and expired are archived.
 */
export async function remove(req, res) {
  const realm = req.realm;
  const leaseId = req.params.id;

  const lease = await Collections.LeaseInstance.findOne({
    _id: leaseId,
    realmId: realm._id
  }).lean();

  if (!lease) {
    throw new ServiceError('lease instance not found', 404);
  }

  if (lease.status !== 'draft') {
    throw new ServiceError(
      `only draft leases can be deleted; this lease is '${lease.status}'`,
      409
    );
  }

  await Collections.LeaseInstance.deleteOne({ _id: leaseId, realmId: realm._id });

  return res.sendStatus(204);
}

/**
 * GET /lease-instances/by-tenant/:tenantId
 * Convenience endpoint to list all leases for a given tenant.
 */
export async function byTenant(req, res) {
  const realm = req.realm;
  const { tenantId } = req.params;

  // Validate tenant exists in realm
  const tenantExists = await Collections.Tenant.exists({
    _id: tenantId,
    realmId: realm._id
  });
  if (!tenantExists) {
    throw new ServiceError('tenant not found', 404);
  }

  await _reconcileExpired(realm._id);

  const leases = await Collections.LeaseInstance.find({
    realmId: realm._id,
    tenantIds: tenantId
  })
    .sort({ createdAt: -1 })
    .lean();

  return res.json(leases);
}

/**
 * GET /lease-instances/by-property/:propertyId
 * Convenience endpoint to list all leases for a given property or unit.
 */
export async function byProperty(req, res) {
  const realm = req.realm;
  const { propertyId } = req.params;

  // Validate property exists in realm
  const propertyExists = await Collections.Property.exists({
    _id: propertyId,
    realmId: realm._id
  });
  if (!propertyExists) {
    throw new ServiceError('property not found', 404);
  }

  await _reconcileExpired(realm._id);

  const leases = await Collections.LeaseInstance.find({
    realmId: realm._id,
    propertyId: String(propertyId)
  })
    .sort({ createdAt: -1 })
    .lean();

  return res.json(leases);
}
