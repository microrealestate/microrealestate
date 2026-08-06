/* eslint-env node, jest */

import { jest, beforeAll, beforeEach, describe, it, expect } from '@jest/globals';

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockUtility = {
  find: jest.fn(),
  findOne: jest.fn(),
  updateOne: jest.fn()
};
// Attachment must be callable as a constructor (new Collections.Attachment(...))
const mockAttachmentSaveInstance = { _id: 'att-new', save: jest.fn().mockResolvedValue(undefined) };
const MockAttachmentCtor = jest.fn().mockImplementation(() => mockAttachmentSaveInstance);
MockAttachmentCtor.find = jest.fn();
MockAttachmentCtor.findOne = jest.fn();
MockAttachmentCtor.deleteMany = jest.fn();
MockAttachmentCtor.create = jest.fn();

const mockRealm = { findOne: jest.fn() };
const mockUtilityAccount = { find: jest.fn() };

jest.unstable_mockModule('@microrealestate/common', () => ({
  Collections: {
    Utility: mockUtility,
    Attachment: MockAttachmentCtor,
    Realm: mockRealm,
    UtilityAccount: mockUtilityAccount
  },
  Crypto: { decrypt: jest.fn((v) => v) },
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
  ServiceError: class ServiceError extends Error {
    constructor(msg, code) { super(msg); this.status = code; }
  }
}));

jest.unstable_mockModule('axios', () => ({
  default: { post: jest.fn(), get: jest.fn() }
}));

jest.unstable_mockModule('fs-extra', () => ({
  default: {
    pathExists: jest.fn(),
    ensureDir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.unstable_mockModule('nanoid', () => ({ nanoid: () => 'nano1234567890ab' }));
jest.unstable_mockModule('../../utils/storage.js', () => ({
  getUploadsDirectory: (...s) => ['/uploads', ...s].join('/')
}));
jest.unstable_mockModule('pdf-parse/lib/pdf-parse.js', () => ({
  default: jest.fn().mockResolvedValue({ text: 'Account: 07-709600-03 Amount: $75.46 2026-08' })
}));

let recaptureAllEmailBills, attachBillScan;
let fsMock, axiosMock;

beforeAll(async () => {
  const fsMod = await import('fs-extra');
  fsMock = fsMod.default;
  const axMod = await import('axios');
  axiosMock = axMod.default;
  const mod = await import('../../managers/utilitymanager.js');
  recaptureAllEmailBills = mod.recaptureAllEmailBills;
  attachBillScan = mod.attachBillScan;
});

function makeReq(overrides = {}) {
  return {
    realm: { _id: 'realm-001' },
    user: { firstname: 'Alice', lastname: 'Smith', email: 'alice@example.com' },
    params: {},
    body: {},
    ...overrides
  };
}

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
}

function fakeRealm() {
  return {
    _id: 'realm-001',
    thirdParties: {
      utilitiesInboxGraph: {
        selected: true,
        tenantId: 'tenant-1',
        clientId: 'client-1',
        clientSecret: 'enc-secret',
        mailboxEmail: 'inbox@example.com'
      }
    }
  };
}

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
describe('recaptureAllEmailBills', () => {
  it('returns empty summary when no email utilities exist', async () => {
    mockUtility.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

    const req = makeReq();
    const res = makeRes();
    await recaptureAllEmailBills(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ restored: 0, alreadyPresent: 0, skipped: 0, failed: 0 })
    );
  });

  it('returns 400 when email inbox is not configured', async () => {
    mockUtility.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { _id: 'u1', realmId: 'realm-001', emailMessageId: 'msg-1', attachmentIds: [] }
      ])
    });
    mockRealm.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: 'realm-001',
        thirdParties: { utilitiesInboxGraph: { selected: false } }
      })
    });

    const req = makeReq();
    const res = makeRes();
    await recaptureAllEmailBills(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('counts alreadyPresent when file is on disk', async () => {
    mockUtility.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { _id: 'u1', realmId: 'realm-001', emailMessageId: 'msg-1', attachmentIds: ['att-1'] }
      ])
    });
    MockAttachmentCtor.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'att-1', storageKey: 'some/path' })
    });
    fsMock.pathExists.mockResolvedValue(true);
    mockRealm.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(fakeRealm()) });

    const req = makeReq();
    const res = makeRes();
    await recaptureAllEmailBills(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ alreadyPresent: 1, restored: 0 })
    );
  });

  it('counts failed when graph fetch throws', async () => {
    mockUtility.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { _id: 'u1', realmId: 'realm-001', emailMessageId: 'msg-1', attachmentIds: [] }
      ])
    });
    MockAttachmentCtor.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    fsMock.pathExists.mockResolvedValue(false);
    mockRealm.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(fakeRealm()) });
    axiosMock.post.mockResolvedValue({ data: { access_token: 'tok' } });
    axiosMock.get.mockRejectedValue(new Error('network'));

    const req = makeReq();
    const res = makeRes();
    await recaptureAllEmailBills(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ failed: 1 })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('attachBillScan', () => {
  it('returns 400 when no file provided', async () => {
    const req = makeReq({ file: undefined });
    const res = makeRes();
    await attachBillScan(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns noMatch:true when no utility record matches', async () => {
    mockUtilityAccount.find.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
    });
    mockUtility.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

    const req = makeReq({
      file: {
        originalname: 'bill.pdf',
        mimetype: 'application/pdf',
        size: 1000,
        buffer: Buffer.from('fake pdf content about account 07-709600-03 billing 2026-08 amount $75.46')
      }
    });
    const res = makeRes();
    await attachBillScan(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ noMatch: true })
    );
  });

  it('attaches file to matching utility without current attachment', async () => {
    mockUtilityAccount.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: 'ua-1', accountNumber: '07-709600-03', type: 'water', provider: 'Oregon City Utility' }
        ])
      })
    });
    mockUtility.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { _id: 'util-1', realmId: 'realm-001', accountNumber: '07-709600-03', billingMonth: '2026-08', attachmentIds: [] }
      ])
    });
    MockAttachmentCtor.deleteMany.mockResolvedValue({});
    mockUtility.updateOne.mockResolvedValue({});
    // No existing PDFs for this utility
    MockAttachmentCtor.find.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
    });

    const req = makeReq({
      file: {
        originalname: 'water-bill-aug.pdf',
        mimetype: 'application/pdf',
        size: 2048,
        buffer: Buffer.from('Water bill 07-709600-03 2026-08 $75.46')
      }
    });
    const res = makeRes();
    await attachBillScan(req, res);

    // File should be written to disk
    expect(fsMock.writeFile).toHaveBeenCalled();
    // Utility should be updated with new attachmentId
    expect(mockUtility.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'util-1' }),
      expect.objectContaining({ attachmentIds: expect.any(Array) })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        results: expect.arrayContaining([
          expect.objectContaining({ status: 'attached' })
        ])
      })
    );
  });

  it('skips utilities that already have a PDF (without overwrite)', async () => {
    mockUtilityAccount.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: 'ua-1', accountNumber: '07-709600-03', type: 'water' }
        ])
      })
    });
    mockUtility.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { _id: 'util-1', realmId: 'realm-001', accountNumber: '07-709600-03', billingMonth: '2026-08', attachmentIds: ['existing-pdf-att'] }
      ])
    });
    // existing-pdf-att is a PDF — so should be skipped
    MockAttachmentCtor.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ _id: 'existing-pdf-att' }])
      })
    });

    const req = makeReq({
      file: {
        originalname: 'bill.pdf',
        mimetype: 'application/pdf',
        size: 1000,
        buffer: Buffer.from('Water bill 07-709600-03 2026-08 $75.46')
      }
    });
    const res = makeRes();
    await attachBillScan(req, res);

    expect(fsMock.writeFile).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        results: expect.arrayContaining([
          expect.objectContaining({ status: 'skipped_has_pdf' })
        ])
      })
    );
  });

  it('appends PDF to utility that only has email text attachment', async () => {
    mockUtilityAccount.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: 'ua-1', accountNumber: '07-709600-03', type: 'water' }
        ])
      })
    });
    mockUtility.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { _id: 'util-1', realmId: 'realm-001', accountNumber: '07-709600-03', billingMonth: '2026-08', attachmentIds: ['email-txt-att'] }
      ])
    });
    // No PDFs found — only email text exists
    MockAttachmentCtor.find.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
    });
    MockAttachmentCtor.deleteMany.mockResolvedValue({});
    mockUtility.updateOne.mockResolvedValue({});

    const req = makeReq({
      file: {
        originalname: 'water-aug.pdf',
        mimetype: 'application/pdf',
        size: 2048,
        buffer: Buffer.from('Water bill 07-709600-03 2026-08 $75.46')
      }
    });
    const res = makeRes();
    await attachBillScan(req, res);

    expect(fsMock.writeFile).toHaveBeenCalled();
    // Should keep 'email-txt-att' and add new PDF id
    expect(mockUtility.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'util-1' }),
      expect.objectContaining({
        attachmentIds: expect.arrayContaining(['email-txt-att'])
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        results: expect.arrayContaining([
          expect.objectContaining({ status: 'attached' })
        ])
      })
    );
  });
});
