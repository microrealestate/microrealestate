/* eslint-env node, jest */
/**
 * Tests for attachment storage key format — verifies utility bills get
 * organized subdirectory keys and all other types get type/id/nanoid keys.
 */

import { jest, beforeAll, beforeEach, describe, it, expect } from '@jest/globals';

// ── Mocks ─────────────────────────────────────────────────────────────────────
let nanoidCallCount = 0;
const FAKE_NANOID = 'TestNanoId12345';

jest.unstable_mockModule('nanoid', () => ({
  nanoid: jest.fn(() => {
    nanoidCallCount++;
    return FAKE_NANOID;
  })
}));

const mockAttachmentInstance = {
  save: jest.fn().mockResolvedValue(undefined),
  _id: 'att-001'
};

const mockCollections = {
  Attachment: jest.fn().mockImplementation(() => mockAttachmentInstance),
  Property: { exists: jest.fn().mockResolvedValue(true) },
  UtilityAccount: { exists: jest.fn().mockResolvedValue(true) },
  Utility: { exists: jest.fn().mockResolvedValue(true) },
  Tenant: { exists: jest.fn().mockResolvedValue(false) },
  Contractor: { exists: jest.fn().mockResolvedValue(false) },
  ContractorWork: { exists: jest.fn().mockResolvedValue(false) },
  LeaseInstance: { exists: jest.fn().mockResolvedValue(false) },
  PropertyTaxStatement: { exists: jest.fn().mockResolvedValue(false) },
  Note: { exists: jest.fn().mockResolvedValue(false) }
};

jest.unstable_mockModule('@microrealestate/common', () => ({
  Collections: mockCollections
}));

jest.unstable_mockModule('../../utils/storage.js', () => ({
  getUploadsDirectory: (...segments) => ['/uploads', ...segments].join('/')
}));

jest.unstable_mockModule('fs-extra', () => ({
  default: {
    ensureDir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    pathExists: jest.fn().mockResolvedValue(true),
    createReadStream: jest.fn().mockReturnValue({ pipe: jest.fn() })
  }
}));

jest.unstable_mockModule('path', () => ({
  default: {
    join: (...args) => args.join('/'),
    dirname: (p) => p.split('/').slice(0, -1).join('/')
  }
}));

let upload;
let fsMock;
let writtenPath;

beforeAll(async () => {
  const fsMod = await import('fs-extra');
  fsMock = fsMod.default;
  fsMock.writeFile.mockImplementation(async (p) => { writtenPath = p; });

  const module = await import('../../managers/attachmentmanager.js');
  upload = module.upload;
});

beforeEach(() => {
  jest.clearAllMocks();
  nanoidCallCount = 0;
  writtenPath = null;
  fsMock.writeFile.mockImplementation(async (p) => { writtenPath = p; });
  mockAttachmentInstance.save.mockResolvedValue(undefined);
});

function makeUploadReq(overrides = {}) {
  return {
    realm: { _id: 'realm-001' },
    user: { email: 'alice@test.com' },
    file: { originalname: 'bill.pdf', mimetype: 'application/pdf', size: 1024, buffer: Buffer.from('test') },
    body: {
      targetType: 'utility_account',
      targetId: 'account-001',
      category: 'utility_bill',
      ...overrides
    }
  };
}

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
}

// ─────────────────────────────────────────────────────────────────────────────
describe('attachment upload — storage key format', () => {
  it('uses nanoid (not Math.random) for all storage keys', async () => {
    const req = makeUploadReq({ targetType: 'property', targetId: 'prop-001', category: 'other' });
    const res = makeRes();
    await upload(req, res);
    expect(nanoidCallCount).toBeGreaterThan(0);
  });

  it('organizes utility_bill by account number and billing month', async () => {
    const req = makeUploadReq({
      targetType: 'utility_account',
      targetId: 'account-001',
      category: 'utility_bill',
      accountNumber: '07-709600-03',
      billingMonth: '2026-08'
    });
    const res = makeRes();
    await upload(req, res);

    expect(writtenPath).toContain('utility_bills');
    expect(writtenPath).toContain('07-709600-03'); // dashes are safe and kept
    expect(writtenPath).toContain('2026-08');       // billingMonth kept as-is
    expect(writtenPath).toContain(FAKE_NANOID);
  });

  it('falls back to targetType/targetId path for utility_bill without accountNumber', async () => {
    const req = makeUploadReq({
      targetType: 'utility_account',
      targetId: 'account-001',
      category: 'utility_bill'
      // no accountNumber or billingMonth
    });
    const res = makeRes();
    await upload(req, res);

    // Should NOT use utility_bills/ subdirectory since no account number
    expect(writtenPath).toContain('utility_account');
    expect(writtenPath).toContain('account-001');
    expect(writtenPath).toContain(FAKE_NANOID);
  });

  it('uses targetType/targetId path for non-utility-bill categories', async () => {
    const req = makeUploadReq({
      targetType: 'property',
      targetId: 'prop-abc',
      category: 'property_photo'
    });
    const res = makeRes();
    await upload(req, res);

    expect(writtenPath).toContain('property');
    expect(writtenPath).toContain('prop-abc');
    expect(writtenPath).toContain(FAKE_NANOID);
    expect(writtenPath).not.toContain('utility_bills');
  });

  it('creates subdirectory before writing file', async () => {
    const req = makeUploadReq({
      accountNumber: '12345',
      billingMonth: '2026-08'
    });
    const res = makeRes();
    await upload(req, res);

    expect(fsMock.ensureDir).toHaveBeenCalled();
  });

  it('returns 400 when file is missing', async () => {
    const req = { ...makeUploadReq(), file: null };
    const res = makeRes();
    await upload(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when targetType or targetId is missing', async () => {
    const req = makeUploadReq({ targetType: '', targetId: '' });
    const res = makeRes();
    await upload(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 201 with attachment on success', async () => {
    const req = makeUploadReq({
      accountNumber: '07-123456',
      billingMonth: '2026-07'
    });
    const res = makeRes();
    await upload(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('attachment download — missing file handling', () => {
  it('returns utility-specific 404 message when bill file is missing', async () => {
    const { download } = await import('../../managers/attachmentmanager.js');

    const mockFindOne = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: 'att-001',
        realmId: 'realm-001',
        targetType: 'utility',
        targetId: 'util-001',
        storageKey: 'utility_bills/12345/2026-08/abc',
        filename: 'bill.pdf',
        mimeType: 'application/pdf',
        category: 'utility_bill'
      })
    });
    mockCollections.Attachment.findOne = mockFindOne;

    fsMock.pathExists.mockResolvedValue(false);

    const req = { realm: { _id: 'realm-001' }, params: { id: 'att-001' } };
    const res = makeRes();
    await download(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('recapture') })
    );
  });
});
