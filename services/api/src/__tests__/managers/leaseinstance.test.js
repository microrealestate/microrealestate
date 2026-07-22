/* eslint-env node, jest */

/**
 * Unit tests for leaseinstancemanager.js
 *
 * Covers all required test scenarios from the implementation plan:
 *  - Tenant/contact updates (invoiceEmail)
 *  - Lease draft creation
 *  - Lease activation
 *  - Required fields before activation
 *  - Assigning leases to tenants
 *  - Assigning leases to properties/units
 *  - Preventing overlapping active leases on same property
 *  - Allowing non-overlapping leases
 *  - Document upload association (signedDocumentId / draftDocumentIds)
 *  - Expired/inactive leases do NOT block new active leases
 */

import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// ── Mock declarations (mutated per test) ─────────────────────────────────────
const mockLeaseInstance = {
  create: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  find: jest.fn(),
  deleteOne: jest.fn(),
  updateOne: jest.fn(),
  updateMany: jest.fn(),
  exists: jest.fn(),
  countDocuments: jest.fn()
};

const mockTenant = {
  exists: jest.fn(),
  countDocuments: jest.fn()
};

const mockProperty = {
  exists: jest.fn()
};

jest.unstable_mockModule('@microrealestate/common', () => ({
  Collections: {
    LeaseInstance: mockLeaseInstance,
    Tenant: mockTenant,
    Property: mockProperty
  },
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  },
  ServiceError: class ServiceError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }
}));

// Functions loaded after mock registration
let create, update, activate, reconcileExpired, all, one, remove, byTenant, byProperty;

beforeAll(async () => {
  const mod = await import('../../managers/leaseinstancemanager.js');
  create = mod.create;
  update = mod.update;
  activate = mod.activate;
  reconcileExpired = mod.reconcileExpired;
  all = mod.all;
  one = mod.one;
  remove = mod.remove;
  byTenant = mod.byTenant;
  byProperty = mod.byProperty;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(overrides = {}) {
  return {
    realm: { _id: 'realm-001' },
    user: { firstname: 'Alice', lastname: 'Smith' },
    params: {},
    query: {},
    body: {},
    ...overrides
  };
}

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis()
  };
}

function mockFindOneOnce(value) {
  mockLeaseInstance.findOne.mockReturnValueOnce({
    lean: jest.fn().mockResolvedValue(value)
  });
}

function mockFindOneAndUpdateOnce(value) {
  mockLeaseInstance.findOneAndUpdate.mockReturnValueOnce({
    lean: jest.fn().mockResolvedValue(value)
  });
}

const FUTURE_START = new Date(Date.now() + 7 * 86400000); // 7 days from now
const FUTURE_END = new Date(Date.now() + 365 * 86400000); // 1 year from now
function fakeDraftLease(overrides = {}) {
  return {
    _id: 'lease-001',
    realmId: 'realm-001',
    status: 'draft',
    startDate: FUTURE_START,
    endDate: FUTURE_END,
    tenantIds: ['tenant-001'],
    propertyId: 'prop-001',
    draftDocumentIds: [],
    signedDocumentId: null,
    notes: '',
    invoiceEmail: null,
    lastUpdatedBy: 'Alice Smith',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

function fakeActiveLease(overrides = {}) {
  return fakeDraftLease({ status: 'active', signedDocumentId: 'attach-001', ...overrides });
}

beforeEach(() => {
  jest.clearAllMocks();

  // Default: no overlapping active leases
  mockLeaseInstance.findOne.mockResolvedValue(null);
  // Default: updateMany (reconcileExpired) affects 0 docs
  mockLeaseInstance.updateMany.mockResolvedValue({ modifiedCount: 0 });
  // Default: tenant and property exist
  mockTenant.countDocuments.mockResolvedValue(1);
  mockTenant.exists.mockResolvedValue(true);
  mockProperty.exists.mockResolvedValue(true);

  // Default mongoose-style query chains
  mockLeaseInstance.findOne.mockReturnValue({
    lean: jest.fn().mockResolvedValue(null)
  });
  mockLeaseInstance.findOneAndUpdate.mockReturnValue({
    lean: jest.fn().mockResolvedValue(null)
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CREATE (draft)
// ─────────────────────────────────────────────────────────────────────────────

describe('create', () => {
  it('creates a draft lease instance with minimal fields', async () => {
    const newLease = fakeDraftLease({ tenantIds: [], propertyId: null });
    mockLeaseInstance.create.mockResolvedValue(newLease);

    const req = makeReq({ body: { notes: 'Initial draft' } });
    const res = makeRes();

    await create(req, res);

    expect(mockLeaseInstance.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'draft', realmId: 'realm-001' })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(newLease);
  });

  it('assigns tenants and property on creation', async () => {
    const newLease = fakeDraftLease();
    mockLeaseInstance.create.mockResolvedValue(newLease);

    const req = makeReq({
      body: {
        tenantIds: ['tenant-001'],
        propertyId: 'prop-001',
        startDate: FUTURE_START.toISOString(),
        endDate: FUTURE_END.toISOString()
      }
    });
    const res = makeRes();

    await create(req, res);

    expect(mockLeaseInstance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantIds: ['tenant-001'],
        propertyId: 'prop-001'
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 422 when a tenantId does not exist in the realm', async () => {
    mockTenant.countDocuments.mockResolvedValue(0); // tenant not found

    const req = makeReq({ body: { tenantIds: ['missing-tenant'] } });
    const res = makeRes();

    await expect(create(req, res)).rejects.toMatchObject({ status: 422 });
    expect(mockLeaseInstance.create).not.toHaveBeenCalled();
  });

  it('returns 422 when propertyId does not exist in the realm', async () => {
    mockProperty.exists.mockResolvedValue(false);

    const req = makeReq({ body: { propertyId: 'bad-prop' } });
    const res = makeRes();

    await expect(create(req, res)).rejects.toMatchObject({ status: 422 });
    expect(mockLeaseInstance.create).not.toHaveBeenCalled();
  });

  it('stores invoiceEmail when provided', async () => {
    const newLease = fakeDraftLease({ invoiceEmail: 'billing@example.com' });
    mockLeaseInstance.create.mockResolvedValue(newLease);

    const req = makeReq({ body: { invoiceEmail: 'billing@example.com' } });
    const res = makeRes();

    await create(req, res);

    expect(mockLeaseInstance.create).toHaveBeenCalledWith(
      expect.objectContaining({ invoiceEmail: 'billing@example.com' })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────

describe('update', () => {
  it('updates a draft lease with new dates and tenants', async () => {
    const draft = fakeDraftLease();
    mockFindOneOnce(draft); // existing
    const updated = { ...draft, notes: 'updated' };
    mockFindOneAndUpdateOnce(updated);

    const req = makeReq({
      params: { id: 'lease-001' },
      body: { notes: 'updated', tenantIds: ['tenant-001'] }
    });
    const res = makeRes();

    await update(req, res);

    expect(mockLeaseInstance.findOneAndUpdate).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('returns 404 when lease not found', async () => {
    mockFindOneOnce(null);

    const req = makeReq({ params: { id: 'bad-id' }, body: { notes: 'x' } });
    const res = makeRes();

    await expect(update(req, res)).rejects.toMatchObject({ status: 404 });
  });

  it('only allows notes/invoiceEmail updates on active leases', async () => {
    const activeLease = fakeActiveLease();
    mockFindOneOnce(activeLease);
    mockFindOneAndUpdateOnce({ ...activeLease, notes: 'new note' });

    const req = makeReq({
      params: { id: 'lease-001' },
      body: {
        notes: 'new note',
        startDate: new Date(Date.now() + 100 * 86400000).toISOString(), // attempted
        tenantIds: ['tenant-999']                                         // attempted
      }
    });
    const res = makeRes();

    await update(req, res);

    // notes should be in the $set but startDate/tenantIds should NOT (active lock)
    const setArg = mockLeaseInstance.findOneAndUpdate.mock.calls[0][1].$set;
    expect(setArg.notes).toBe('new note');
    expect(setArg.startDate).toBeUndefined();
    expect(setArg.tenantIds).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVATE
// ─────────────────────────────────────────────────────────────────────────────

describe('activate', () => {
  it('activates a draft lease when all required fields are set', async () => {
    const draft = fakeDraftLease({ signedDocumentId: 'attach-001' });
    // findOne #1: the lease itself; findOne #2: overlap check returns null (no conflict)
    mockFindOneOnce(draft); // fetch lease
    mockFindOneOnce(null); // overlap check

    const activated = { ...draft, status: 'active', activatedAt: new Date() };
    mockFindOneAndUpdateOnce(activated);

    const req = makeReq({ params: { id: 'lease-001' }, body: {} });
    const res = makeRes();

    await activate(req, res);

    expect(mockLeaseInstance.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'lease-001' }),
      expect.objectContaining({ $set: expect.objectContaining({ status: 'active' }) }),
      expect.anything()
    );
    expect(res.json).toHaveBeenCalledWith(activated);
  });

  it('returns 422 when startDate is missing', async () => {
    const draft = fakeDraftLease({ startDate: null });
    mockFindOneOnce(draft);

    const req = makeReq({ params: { id: 'lease-001' }, body: {} });
    const res = makeRes();

    await activate(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ errors: expect.arrayContaining([expect.stringContaining('startDate')]) })
    );
  });

  it('returns 422 when endDate is missing', async () => {
    const draft = fakeDraftLease({ endDate: null });
    mockFindOneOnce(draft);

    const req = makeReq({ params: { id: 'lease-001' }, body: {} });
    const res = makeRes();

    await activate(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ errors: expect.arrayContaining([expect.stringContaining('endDate')]) })
    );
  });

  it('returns 422 when no tenants are assigned', async () => {
    const draft = fakeDraftLease({ tenantIds: [], signedDocumentId: 'attach-001' });
    mockFindOneOnce(draft);

    const req = makeReq({ params: { id: 'lease-001' }, body: {} });
    const res = makeRes();

    await activate(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ errors: expect.arrayContaining([expect.stringContaining('tenant')]) })
    );
  });

  it('returns 422 when no property is assigned', async () => {
    const draft = fakeDraftLease({ propertyId: null, signedDocumentId: 'attach-001' });
    mockFindOneOnce(draft);

    const req = makeReq({ params: { id: 'lease-001' }, body: {} });
    const res = makeRes();

    await activate(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ errors: expect.arrayContaining([expect.stringContaining('property')]) })
    );
  });

  it('activates successfully without a signed document (optional)', async () => {
    const draft = fakeDraftLease({ signedDocumentId: null });
    mockFindOneOnce(draft);
    mockLeaseInstance.findOneAndUpdate.mockReturnValueOnce({
      lean: () => Promise.resolve({ ...draft, status: 'active', activatedAt: new Date() })
    });

    const req = makeReq({ params: { id: 'lease-001' }, body: {} });
    const res = makeRes();

    await activate(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active' })
    );
  });

  it('returns 422 when multiple required fields are missing', async () => {
    const draft = fakeDraftLease({
      startDate: null,
      endDate: null,
      tenantIds: [],
      propertyId: null,
      signedDocumentId: null
    });
    mockFindOneOnce(draft);

    const req = makeReq({ params: { id: 'lease-001' }, body: {} });
    const res = makeRes();

    await activate(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    const { errors } = res.json.mock.calls[0][0];
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });

  it('returns 409 when trying to activate an already-active lease', async () => {
    const active = fakeActiveLease();
    mockFindOneOnce(active);

    const req = makeReq({ params: { id: 'lease-001' }, body: {} });
    const res = makeRes();

    await expect(activate(req, res)).rejects.toMatchObject({ status: 409 });
  });

  it('returns 404 when lease does not exist', async () => {
    mockFindOneOnce(null);

    const req = makeReq({ params: { id: 'missing' }, body: {} });
    const res = makeRes();

    await expect(activate(req, res)).rejects.toMatchObject({ status: 404 });
  });

  // ── Overlap detection ──────────────────────────────────────────────────────

  it('PREVENTS overlapping active lease on same property', async () => {
    const draft = fakeDraftLease({ signedDocumentId: 'attach-001' });
    const conflicting = fakeActiveLease({ _id: 'lease-002' });

    mockFindOneOnce(draft); // fetch lease
    mockFindOneOnce(conflicting); // overlap check returns conflict

    const req = makeReq({ params: { id: 'lease-001' }, body: {} });
    const res = makeRes();

    await activate(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('active lease already exists'),
        conflictingLeaseId: 'lease-002'
      })
    );
    expect(mockLeaseInstance.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('ALLOWS non-overlapping lease on same property', async () => {
    // Draft with future dates; overlap query returns null (no conflict)
    const draft = fakeDraftLease({ signedDocumentId: 'attach-001' });

    mockFindOneOnce(draft); // fetch lease
    mockFindOneOnce(null); // overlap check: no conflict

    const activated = { ...draft, status: 'active' };
    mockFindOneAndUpdateOnce(activated);

    const req = makeReq({ params: { id: 'lease-001' }, body: {} });
    const res = makeRes();

    await activate(req, res);

    expect(res.json).toHaveBeenCalledWith(activated);
  });

  it('ALLOWS new active lease when existing lease is expired', async () => {
    // The overlap query filters status='active', so an expired lease is never returned
    const draft = fakeDraftLease({ signedDocumentId: 'attach-001' });

    // reconcileExpired updates 0, overlap check returns null (expired leases excluded)
    mockFindOneOnce(draft); // fetch lease
    mockFindOneOnce(null); // overlap check: expired leases don't appear

    const activated = { ...draft, status: 'active' };
    mockFindOneAndUpdateOnce(activated);

    const req = makeReq({ params: { id: 'lease-001' }, body: {} });
    const res = makeRes();

    await activate(req, res);

    expect(res.json).toHaveBeenCalledWith(activated);
  });

  it('accepts signedDocumentId provided at activation time', async () => {
    const draft = fakeDraftLease({ signedDocumentId: null }); // no signed doc yet

    mockFindOneOnce(draft);
    mockFindOneOnce(null); // no overlap

    const activated = { ...draft, status: 'active', signedDocumentId: 'attach-new' };
    mockFindOneAndUpdateOnce(activated);

    const req = makeReq({
      params: { id: 'lease-001' },
      body: { signedDocumentId: 'attach-new' }
    });
    const res = makeRes();

    await activate(req, res);

    expect(mockLeaseInstance.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        $set: expect.objectContaining({ signedDocumentId: 'attach-new' })
      }),
      expect.anything()
    );
    expect(res.json).toHaveBeenCalledWith(activated);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LIST / GET / DELETE
// ─────────────────────────────────────────────────────────────────────────────

describe('all', () => {
  it('returns all lease instances for the realm', async () => {
    const leases = [fakeDraftLease(), fakeActiveLease({ _id: 'lease-002' })];
    mockLeaseInstance.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(leases) })
    });

    const req = makeReq();
    const res = makeRes();
    await all(req, res);

    expect(mockLeaseInstance.find).toHaveBeenCalledWith(
      expect.objectContaining({ realmId: 'realm-001' })
    );
    expect(res.json).toHaveBeenCalledWith(leases);
  });

  it('filters by status', async () => {
    mockLeaseInstance.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
    });

    const req = makeReq({ query: { status: 'active' } });
    const res = makeRes();
    await all(req, res);

    expect(mockLeaseInstance.find).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active' })
    );
  });

  it('filters by propertyId', async () => {
    mockLeaseInstance.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
    });

    const req = makeReq({ query: { propertyId: 'prop-001' } });
    const res = makeRes();
    await all(req, res);

    expect(mockLeaseInstance.find).toHaveBeenCalledWith(
      expect.objectContaining({ propertyId: 'prop-001' })
    );
  });
});

describe('one', () => {
  it('returns 404 when lease not found', async () => {
    mockFindOneOnce(null);

    const req = makeReq({ params: { id: 'bad-id' } });
    const res = makeRes();

    await expect(one(req, res)).rejects.toMatchObject({ status: 404 });
  });

  it('returns the lease when found', async () => {
    const lease = fakeDraftLease();
    mockFindOneOnce(lease);

    const req = makeReq({ params: { id: 'lease-001' } });
    const res = makeRes();
    await one(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ _id: 'lease-001' }));
  });
});

describe('remove', () => {
  it('deletes a draft lease', async () => {
    const draft = fakeDraftLease();
    mockFindOneOnce(draft);
    mockLeaseInstance.deleteOne.mockResolvedValue({ deletedCount: 1 });

    const req = makeReq({ params: { id: 'lease-001' } });
    const res = makeRes();
    await remove(req, res);

    expect(mockLeaseInstance.deleteOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'lease-001' })
    );
    expect(res.sendStatus).toHaveBeenCalledWith(204);
  });

  it('returns 409 when trying to delete an active lease', async () => {
    const active = fakeActiveLease();
    mockFindOneOnce(active);

    const req = makeReq({ params: { id: 'lease-001' } });
    const res = makeRes();

    await expect(remove(req, res)).rejects.toMatchObject({ status: 409 });
    expect(mockLeaseInstance.deleteOne).not.toHaveBeenCalled();
  });

  it('returns 404 when lease not found', async () => {
    mockFindOneOnce(null);

    const req = makeReq({ params: { id: 'bad-id' } });
    const res = makeRes();

    await expect(remove(req, res)).rejects.toMatchObject({ status: 404 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TENANT / PROPERTY ASSOCIATION
// ─────────────────────────────────────────────────────────────────────────────

describe('byTenant', () => {
  it('returns leases for a given tenant', async () => {
    const leases = [fakeActiveLease()];
    mockLeaseInstance.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(leases) })
    });

    const req = makeReq({ params: { tenantId: 'tenant-001' } });
    const res = makeRes();
    await byTenant(req, res);

    expect(mockLeaseInstance.find).toHaveBeenCalledWith(
      expect.objectContaining({ tenantIds: 'tenant-001' })
    );
    expect(res.json).toHaveBeenCalledWith(leases);
  });

  it('returns 404 when tenant not found', async () => {
    mockTenant.exists.mockResolvedValue(false);

    const req = makeReq({ params: { tenantId: 'bad-tenant' } });
    const res = makeRes();

    await expect(byTenant(req, res)).rejects.toMatchObject({ status: 404 });
  });
});

describe('byProperty', () => {
  it('returns leases for a given property', async () => {
    const leases = [fakeActiveLease()];
    mockLeaseInstance.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(leases) })
    });

    const req = makeReq({ params: { propertyId: 'prop-001' } });
    const res = makeRes();
    await byProperty(req, res);

    expect(mockLeaseInstance.find).toHaveBeenCalledWith(
      expect.objectContaining({ propertyId: 'prop-001' })
    );
    expect(res.json).toHaveBeenCalledWith(leases);
  });

  it('returns 404 when property not found', async () => {
    mockProperty.exists.mockResolvedValue(false);

    const req = makeReq({ params: { propertyId: 'bad-prop' } });
    const res = makeRes();

    await expect(byProperty(req, res)).rejects.toMatchObject({ status: 404 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT ASSOCIATION
// ─────────────────────────────────────────────────────────────────────────────

describe('document association', () => {
  it('creates draft lease with draftDocumentIds', async () => {
    const newLease = fakeDraftLease({ draftDocumentIds: ['attach-draft-001'] });
    mockLeaseInstance.create.mockResolvedValue(newLease);

    const req = makeReq({ body: { draftDocumentIds: ['attach-draft-001'] } });
    const res = makeRes();

    await create(req, res);

    expect(mockLeaseInstance.create).toHaveBeenCalledWith(
      expect.objectContaining({ draftDocumentIds: ['attach-draft-001'] })
    );
  });

  it('creates draft lease with signedDocumentId', async () => {
    const newLease = fakeDraftLease({ signedDocumentId: 'attach-signed-001' });
    mockLeaseInstance.create.mockResolvedValue(newLease);

    const req = makeReq({ body: { signedDocumentId: 'attach-signed-001' } });
    const res = makeRes();

    await create(req, res);

    expect(mockLeaseInstance.create).toHaveBeenCalledWith(
      expect.objectContaining({ signedDocumentId: 'attach-signed-001' })
    );
  });

  it('can update draftDocumentIds on a draft lease', async () => {
    const draft = fakeDraftLease();
    mockFindOneOnce(draft);
    const updated = { ...draft, draftDocumentIds: ['attach-draft-001', 'attach-draft-002'] };
    mockFindOneAndUpdateOnce(updated);

    const req = makeReq({
      params: { id: 'lease-001' },
      body: { draftDocumentIds: ['attach-draft-001', 'attach-draft-002'] }
    });
    const res = makeRes();

    await update(req, res);

    expect(mockLeaseInstance.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        $set: expect.objectContaining({ draftDocumentIds: ['attach-draft-001', 'attach-draft-002'] })
      }),
      expect.anything()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RECONCILE EXPIRED
// ─────────────────────────────────────────────────────────────────────────────

describe('reconcileExpired', () => {
  it('returns count of leases that were expired', async () => {
    mockLeaseInstance.updateMany.mockResolvedValue({ modifiedCount: 3 });

    const req = makeReq();
    const res = makeRes();
    await reconcileExpired(req, res);

    expect(mockLeaseInstance.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active', endDate: expect.any(Object) }),
      expect.objectContaining({ $set: { status: 'expired' } })
    );
    expect(res.json).toHaveBeenCalledWith({ expiredCount: 3 });
  });

  it('returns 0 when no leases need expiring', async () => {
    mockLeaseInstance.updateMany.mockResolvedValue({ modifiedCount: 0 });

    const req = makeReq();
    const res = makeRes();
    await reconcileExpired(req, res);

    expect(res.json).toHaveBeenCalledWith({ expiredCount: 0 });
  });
});
