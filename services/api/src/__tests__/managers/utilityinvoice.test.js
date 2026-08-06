/* eslint-env node, jest */

/**
 * Unit tests for utilityinvoicemanager.js
 * Uses jest.unstable_mockModule for ESM-compatible mocking.
 */

import { jest, beforeAll, beforeEach, describe, it, expect } from '@jest/globals';

// ── Mock objects declared at module scope (mutated per test) ─────────────────
const mockUtility = {
  findOne: jest.fn(),
  updateOne: jest.fn()
};
const mockUtilityInvoice = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  insertMany: jest.fn()
};
const mockUtilityActivity = {
  create: jest.fn()
};
const mockProperty = {
  find: jest.fn()
};
const mockTenant = {
  find: jest.fn()
};

// ESM-native mock must be called before dynamic import
jest.unstable_mockModule('@microrealestate/common', () => ({
  Collections: {
    Utility: mockUtility,
    UtilityInvoice: mockUtilityInvoice,
    UtilityActivity: mockUtilityActivity,
    Property: mockProperty,
    Tenant: mockTenant
  }
}));

// Functions populated in beforeAll via dynamic import
let generateInvoices,
  listInvoices,
  getInvoice,
  sendInvoice,
  markPaid,
  voidInvoice,
  logQbPosted,
  outstandingSummary;

beforeAll(async () => {
  const module = await import('../../managers/utilityinvoicemanager.js');
  generateInvoices = module.generateInvoices;
  listInvoices = module.listInvoices;
  getInvoice = module.getInvoice;
  sendInvoice = module.sendInvoice;
  markPaid = module.markPaid;
  voidInvoice = module.voidInvoice;
  logQbPosted = module.logQbPosted;
  outstandingSummary = module.outstandingSummary;
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
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis()
  };
  return res;
}

function fakeUtility(overrides = {}) {
  return {
    _id: 'util-001',
    realmId: 'realm-001',
    propertyId: 'prop-001',
    billingMonth: '2026-06',
    type: 'electric',
    amount: 300,
    vat: 0,
    invoicedAt: null,
    ...overrides
  };
}

function fakeInvoice(overrides = {}) {
  return {
    _id: 'inv-001',
    realmId: 'realm-001',
    utilityId: 'util-001',
    occupantId: 'occ-001',
    occupantEmail: 'bob@example.com',
    billingMonth: '2026-06',
    invoiceAmount: 300,
    invoiceNumber: 'UTL-2026-06-001',
    status: 'draft',
    ...overrides
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Default: no child properties (unit tests target the direct property only)
  mockProperty.find.mockReturnValue({
    select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('listInvoices', () => {
  it('returns all invoices for realm', async () => {
    const invoices = [fakeInvoice(), fakeInvoice({ _id: 'inv-002' })];
    mockUtilityInvoice.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(invoices) })
    });

    const req = makeReq();
    const res = makeRes();
    await listInvoices(req, res);

    expect(mockUtilityInvoice.find).toHaveBeenCalledWith({ realmId: 'realm-001' });
    expect(res.json).toHaveBeenCalledWith(invoices);
  });

  it('applies optional query filters', async () => {
    mockUtilityInvoice.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
    });

    const req = makeReq({ query: { status: 'outstanding', billingMonth: '2026-06' } });
    const res = makeRes();
    await listInvoices(req, res);

    expect(mockUtilityInvoice.find).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'outstanding', billingMonth: '2026-06' })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('getInvoice', () => {
  it('returns 404 when invoice not found', async () => {
    mockUtilityInvoice.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const req = makeReq({ params: { id: 'inv-999' } });
    const res = makeRes();
    await getInvoice(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns invoice when found', async () => {
    const invoice = fakeInvoice();
    mockUtilityInvoice.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(invoice) });

    const req = makeReq({ params: { id: 'inv-001' } });
    const res = makeRes();
    await getInvoice(req, res);

    expect(res.json).toHaveBeenCalledWith(invoice);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('generateInvoices', () => {
  it('returns 400 when utilityId is missing', async () => {
    const req = makeReq({ body: {} });
    const res = makeRes();
    await generateInvoices(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when utility not found', async () => {
    mockUtility.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const req = makeReq({ body: { utilityId: 'util-999' } });
    const res = makeRes();
    await generateInvoices(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 409 when utility already invoiced', async () => {
    const utility = fakeUtility({ invoicedAt: new Date() });
    mockUtility.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(utility) });

    const req = makeReq({ body: { utilityId: 'util-001' } });
    const res = makeRes();
    await generateInvoices(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('returns 422 when no occupants on property', async () => {
    mockUtility.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(fakeUtility()) });
    mockTenant.find.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
    });

    const req = makeReq({ body: { utilityId: 'util-001' } });
    const res = makeRes();
    await generateInvoices(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('creates invoices and stamps utility when occupants exist', async () => {
    const utility = fakeUtility();
    mockUtility.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(utility) });

    const occupants = [{ _id: 'occ-001', name: 'Bob Tenant', properties: [] }];
    mockTenant.find.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(occupants) })
    });

    const createdInvoices = [{ ...fakeInvoice(), toObject: () => fakeInvoice() }];
    mockUtilityInvoice.insertMany.mockResolvedValue(createdInvoices);
    mockUtility.updateOne.mockResolvedValue({});
    mockUtilityActivity.create.mockResolvedValue({});

    const req = makeReq({ body: { utilityId: 'util-001' } });
    const res = makeRes();
    await generateInvoices(req, res);

    expect(mockUtilityInvoice.insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ occupantId: 'occ-001', invoiceAmount: 300 })
      ]),
      { ordered: true }
    );
    expect(mockUtility.updateOne).toHaveBeenCalledWith(
      { _id: utility._id },
      expect.objectContaining({ invoicedAt: expect.any(Date), invoicedBy: expect.any(String) })
    );
    expect(mockUtilityActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'invoiced' })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('sets invoice amount and totalAmount from utility', async () => {
    const utility = fakeUtility({ amount: 450, vat: 50 });
    mockUtility.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(utility) });
    mockTenant.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ _id: 'occ-001', name: 'T1', properties: [] }])
      })
    });
    const created = [{ toObject: () => ({}) }];
    mockUtilityInvoice.insertMany.mockResolvedValue(created);
    mockUtility.updateOne.mockResolvedValue({});
    mockUtilityActivity.create.mockResolvedValue({});

    const req = makeReq({ body: { utilityId: 'util-001' } });
    const res = makeRes();
    await generateInvoices(req, res);

    expect(mockUtilityInvoice.insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ invoiceAmount: 450 })
      ]),
      expect.anything()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('sendInvoice', () => {
  it('returns 404 when invoice not found', async () => {
    mockUtilityInvoice.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const req = makeReq({ params: { id: 'inv-999' } });
    const res = makeRes();
    await sendInvoice(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 409 for non-sendable status (paid)', async () => {
    mockUtilityInvoice.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeInvoice({ status: 'paid' }))
    });

    const req = makeReq({ params: { id: 'inv-001' } });
    const res = makeRes();
    await sendInvoice(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('returns 409 for voided invoice', async () => {
    mockUtilityInvoice.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeInvoice({ status: 'void' }))
    });

    const req = makeReq({ params: { id: 'inv-001' } });
    const res = makeRes();
    await sendInvoice(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('transitions draft invoice to outstanding', async () => {
    mockUtilityInvoice.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeInvoice({ status: 'draft' }))
    });
    const updated = fakeInvoice({ status: 'outstanding' });
    mockUtilityInvoice.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue(updated)
    });
    mockUtilityActivity.create.mockResolvedValue({});

    const req = makeReq({ params: { id: 'inv-001' } });
    const res = makeRes();
    await sendInvoice(req, res);

    expect(mockUtilityInvoice.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'inv-001' },
      expect.objectContaining({ status: 'outstanding', sentAt: expect.any(Date) }),
      { new: true }
    );
    expect(mockUtilityActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'invoice_sent' })
    );
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('can re-send an outstanding invoice', async () => {
    mockUtilityInvoice.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeInvoice({ status: 'outstanding' }))
    });
    mockUtilityInvoice.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeInvoice({ status: 'outstanding' }))
    });
    mockUtilityActivity.create.mockResolvedValue({});

    const req = makeReq({ params: { id: 'inv-001' } });
    const res = makeRes();
    await sendInvoice(req, res);

    expect(res.json).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('markPaid', () => {
  it('returns 404 when invoice not found', async () => {
    mockUtilityInvoice.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const req = makeReq({ params: { id: 'inv-999' } });
    const res = makeRes();
    await markPaid(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 409 when already paid', async () => {
    mockUtilityInvoice.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeInvoice({ status: 'paid' }))
    });

    const req = makeReq({ params: { id: 'inv-001' } });
    const res = makeRes();
    await markPaid(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('returns 409 for voided invoice', async () => {
    mockUtilityInvoice.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeInvoice({ status: 'void' }))
    });

    const req = makeReq({ params: { id: 'inv-001' } });
    const res = makeRes();
    await markPaid(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('marks outstanding invoice as paid with payment details', async () => {
    mockUtilityInvoice.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeInvoice({ status: 'outstanding' }))
    });
    const updated = fakeInvoice({ status: 'paid' });
    mockUtilityInvoice.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue(updated)
    });
    mockUtilityActivity.create.mockResolvedValue({});

    const req = makeReq({
      params: { id: 'inv-001' },
      body: { paymentMethod: 'check', paymentReference: 'CHK-123', paymentNotes: 'paid in full' }
    });
    const res = makeRes();
    await markPaid(req, res);

    expect(mockUtilityInvoice.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'inv-001' },
      expect.objectContaining({
        status: 'paid',
        paidAt: expect.any(Date),
        paymentMethod: 'check',
        paymentReference: 'CHK-123',
        paymentNotes: 'paid in full'
      }),
      { new: true }
    );
    expect(mockUtilityActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'payment_received',
        details: expect.objectContaining({ paymentMethod: 'check', paymentReference: 'CHK-123' })
      })
    );
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('records actor name in paidBy', async () => {
    mockUtilityInvoice.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeInvoice({ status: 'outstanding' }))
    });
    mockUtilityInvoice.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeInvoice({ status: 'paid' }))
    });
    mockUtilityActivity.create.mockResolvedValue({});

    const req = makeReq({ params: { id: 'inv-001' }, body: {} });
    const res = makeRes();
    await markPaid(req, res);

    expect(mockUtilityInvoice.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ paidBy: 'Alice Smith' }),
      expect.anything()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('voidInvoice', () => {
  it('returns 404 when invoice not found', async () => {
    mockUtilityInvoice.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const req = makeReq({ params: { id: 'inv-999' } });
    const res = makeRes();
    await voidInvoice(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 409 when already voided', async () => {
    mockUtilityInvoice.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeInvoice({ status: 'void' }))
    });

    const req = makeReq({ params: { id: 'inv-001' } });
    const res = makeRes();
    await voidInvoice(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('returns 409 for paid invoice', async () => {
    mockUtilityInvoice.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeInvoice({ status: 'paid' }))
    });

    const req = makeReq({ params: { id: 'inv-001' } });
    const res = makeRes();
    await voidInvoice(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('voids a draft invoice with reason', async () => {
    mockUtilityInvoice.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeInvoice({ status: 'draft' }))
    });
    const voided = fakeInvoice({ status: 'void', voidReason: 'Duplicate entry' });
    mockUtilityInvoice.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue(voided)
    });

    const req = makeReq({ params: { id: 'inv-001' }, body: { reason: 'Duplicate entry' } });
    const res = makeRes();
    await voidInvoice(req, res);

    expect(mockUtilityInvoice.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'inv-001' },
      expect.objectContaining({ status: 'void', voidReason: 'Duplicate entry' }),
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith(voided);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('logQbPosted', () => {
  it('returns 404 when utility not found', async () => {
    mockUtility.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) })
    });

    const req = makeReq({ params: { id: 'util-999' }, body: {} });
    const res = makeRes();
    await logQbPosted(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('creates a qb_posted activity with reference', async () => {
    mockUtility.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'util-001' })
      })
    });
    mockUtility.findByIdAndUpdate = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'util-001', qbPostedAt: new Date() }) });
    const activity = { _id: 'act-001', toObject: () => ({ eventType: 'qb_posted' }) };
    mockUtilityActivity.create.mockResolvedValue(activity);

    const req = makeReq({
      params: { id: 'util-001' },
      body: { qbReference: 'QB-2026-001', notes: 'Posted to Q2 ledger' }
    });
    const res = makeRes();
    await logQbPosted(req, res);

    expect(mockUtilityActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'qb_posted',
        details: expect.objectContaining({ qbReference: 'QB-2026-001' }),
        notes: 'Posted to Q2 ledger'
      })
    );
    // QB status must also be written back to the Utility record
    expect(mockUtility.findByIdAndUpdate).toHaveBeenCalledWith(
      'util-001',
      expect.objectContaining({ qbPostedAt: expect.any(Date), qbPostedBy: expect.any(String) }),
      expect.objectContaining({ new: true })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('records actor name', async () => {
    mockUtility.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'util-001' })
      })
    });
    mockUtility.findByIdAndUpdate = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({}) });
    const activity = { _id: 'act-001', toObject: () => ({}) };
    mockUtilityActivity.create.mockResolvedValue(activity);

    const req = makeReq({ params: { id: 'util-001' }, body: {} });
    const res = makeRes();
    await logQbPosted(req, res);

    expect(mockUtilityActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({ actor: 'Alice Smith' })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('outstandingSummary', () => {
  it('returns empty array when no outstanding invoices', async () => {
    mockUtilityInvoice.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
    });

    const req = makeReq();
    const res = makeRes();
    await outstandingSummary(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('groups outstanding invoices by occupant', async () => {
    const invoices = [
      fakeInvoice({ _id: 'i1', occupantId: 'occ-001', occupantEmail: 'bob@example.com', invoiceAmount: 300, status: 'outstanding' }),
      fakeInvoice({ _id: 'i2', occupantId: 'occ-001', occupantEmail: 'bob@example.com', invoiceAmount: 150, billingMonth: '2026-05', status: 'outstanding' }),
      fakeInvoice({ _id: 'i3', occupantId: 'occ-002', occupantEmail: 'carol@example.com', invoiceAmount: 200, status: 'outstanding' })
    ];
    mockUtilityInvoice.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(invoices) })
    });

    const req = makeReq();
    const res = makeRes();
    await outstandingSummary(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result).toHaveLength(2);

    const bob = result.find((r) => r.occupantId === 'occ-001');
    expect(bob.totalOutstanding).toBe(450);
    expect(bob.invoiceCount).toBe(2);

    const carol = result.find((r) => r.occupantId === 'occ-002');
    expect(carol.totalOutstanding).toBe(200);
    expect(carol.invoiceCount).toBe(1);
  });

  it('queries for outstanding and sent status', async () => {
    mockUtilityInvoice.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
    });

    const req = makeReq();
    const res = makeRes();
    await outstandingSummary(req, res);

    expect(mockUtilityInvoice.find).toHaveBeenCalledWith(
      expect.objectContaining({
        status: { $in: ['outstanding', 'sent'] }
      })
    );
  });
});
