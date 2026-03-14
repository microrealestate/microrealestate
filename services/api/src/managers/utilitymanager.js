import { createLog, diffObjects } from './auditlogmanager.js';
import { Collections } from '@microrealestate/common';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

function _getUserFullName(req) {
  const u = req.user || {};
  return [u.firstname, u.lastname].filter(Boolean).join(' ') || u.email || '';
}

const MONTH_NAMES = {
  jan: '01',
  january: '01',
  feb: '02',
  february: '02',
  mar: '03',
  march: '03',
  apr: '04',
  april: '04',
  may: '05',
  jun: '06',
  june: '06',
  jul: '07',
  july: '07',
  aug: '08',
  august: '08',
  sep: '09',
  sept: '09',
  september: '09',
  oct: '10',
  october: '10',
  nov: '11',
  november: '11',
  dec: '12',
  december: '12'
};

function normalizeAccountNumber(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function parseCurrencyValue(value) {
  const normalized = String(value || '').replace(/[$,\s]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseIsoDate(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  const isoMatch = raw.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day) &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const usMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (usMatch) {
    const month = Number(usMatch[1]);
    const day = Number(usMatch[2]);
    const yearToken = usMatch[3];
    const year =
      yearToken.length === 2 ? 2000 + Number(yearToken) : Number(yearToken);
    if (
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day) &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const monthNameMatch = raw.match(
    /^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2}),?\s+(\d{2,4})$/i
  );
  if (monthNameMatch) {
    const monthToken = monthNameMatch[1].toLowerCase();
    const month =
      MONTH_NAMES[monthToken] || MONTH_NAMES[monthToken.slice(0, 3)];
    const day = Number(monthNameMatch[2]);
    const yearToken = monthNameMatch[3];
    const year =
      yearToken.length === 2 ? 2000 + Number(yearToken) : Number(yearToken);
    if (month && Number.isFinite(day) && day >= 1 && day <= 31) {
      return `${year}-${month}-${String(day).padStart(2, '0')}`;
    }
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

function toBillingMonthFromDate(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return null;
  }
  return isoDate.slice(0, 7);
}

function extractByPatterns(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return String(match[1]).trim();
    }
  }

  return '';
}

function inferUtilityType(text, filename = '') {
  const source =
    `${String(filename || '')}\n${String(text || '')}`.toLowerCase();

  if (/\b(water|h2o|aqua)\b/.test(source)) {
    return 'water';
  }
  if (/\b(sewer|wastewater)\b/.test(source)) {
    return 'sewer';
  }
  if (
    /\b(electric|electricity|kwh|kilowatt|power|pge|pacific power)\b/.test(
      source
    )
  ) {
    return 'power';
  }
  if (/\b(natural gas|northwest natural|nw natural|therm)\b/.test(source)) {
    return 'gas';
  }
  if (
    /\b(trash|garbage|sanitation|waste management|recycling)\b/.test(source)
  ) {
    return 'trash';
  }
  if (
    /\b(internet|broadband|fiber|xfinity|comcast|centurylink)\b/.test(source)
  ) {
    return 'internet';
  }

  return 'other';
}

function inferProvider(text, filename = '') {
  const providerFromLabel = extractByPatterns(text, [
    /(?:service|utility)?\s*provider\s*[:#-]?\s*([^\n]+)/i,
    /make\s+checks?\s+payable\s+to\s*[:#-]?\s*([^\n]+)/i
  ]);

  if (providerFromLabel) {
    return providerFromLabel;
  }

  const fromFilename = String(filename || '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim();

  const filenamePrefix = fromFilename
    .split(/\s{2,}|\d{4,}/)[0]
    .replace(/\b(view|bill|statement|copy)\b/gi, '')
    .trim();

  if (filenamePrefix.length >= 3) {
    return filenamePrefix;
  }

  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);

  const upperCandidate = lines.find((line) => {
    if (line.length < 3 || line.length > 60) {
      return false;
    }

    if (/\d{3,}/.test(line)) {
      return false;
    }

    return /^[A-Z0-9 '&.,-]+$/.test(line);
  });

  return upperCandidate || '';
}

function parseUtilityBillFields(text, filename = '') {
  const mergedText = `${String(filename || '')}\n${String(text || '')}`;

  const accountNumberRaw =
    extractByPatterns(mergedText, [
      /account\s*(?:number|no\.?|#)?\s*[:#-]?\s*([a-z0-9\- ]{4,30})/i,
      /customer\s*(?:account|id)\s*[:#-]?\s*([a-z0-9\- ]{4,30})/i
    ]) || '';

  const accountNumber = accountNumberRaw
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9-]/gi, '')
    .slice(0, 40);

  const amountCandidate = extractByPatterns(mergedText, [
    /total\s*(?:amount\s*)?due\s*[:$]?\s*([\d,]+(?:\.\d{2})?)/i,
    /amount\s*due\s*[:$]?\s*([\d,]+(?:\.\d{2})?)/i,
    /current\s*charges?\s*[:$]?\s*([\d,]+(?:\.\d{2})?)/i,
    /new\s*charges?\s*[:$]?\s*([\d,]+(?:\.\d{2})?)/i,
    /balance\s*(?:forward|due)?\s*[:$]?\s*([\d,]+(?:\.\d{2})?)/i
  ]);
  const amount = parseCurrencyValue(amountCandidate);

  const dueDate = parseIsoDate(
    extractByPatterns(mergedText, [
      /(?:payment\s*)?due\s*date\s*[:#-]?\s*([^\n]+)/i,
      /due\s*[:#-]?\s*([^\n]+)/i
    ])
  );

  const billingDate = parseIsoDate(
    extractByPatterns(mergedText, [
      /statement\s*date\s*[:#-]?\s*([^\n]+)/i,
      /bill\s*date\s*[:#-]?\s*([^\n]+)/i,
      /service\s*date\s*[:#-]?\s*([^\n]+)/i
    ])
  );

  const servicePeriodStart = parseIsoDate(
    extractByPatterns(mergedText, [
      /service\s*(?:period\s*)?(?:from|start)\s*[:#-]?\s*([^\n]+)/i,
      /period\s*(?:from|start)\s*[:#-]?\s*([^\n]+)/i
    ])
  );

  const servicePeriodEnd = parseIsoDate(
    extractByPatterns(mergedText, [
      /service\s*(?:period\s*)?(?:to|end|through)\s*[:#-]?\s*([^\n]+)/i,
      /period\s*(?:to|end|through)\s*[:#-]?\s*([^\n]+)/i
    ])
  );

  const serviceRangeMatch = mergedText.match(
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})\s*(?:to|through|-)\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})/i
  );

  const rangeStart = serviceRangeMatch
    ? parseIsoDate(serviceRangeMatch[1])
    : null;
  const rangeEnd = serviceRangeMatch
    ? parseIsoDate(serviceRangeMatch[2])
    : null;

  const billingMonth =
    toBillingMonthFromDate(servicePeriodEnd) ||
    toBillingMonthFromDate(rangeEnd) ||
    toBillingMonthFromDate(billingDate) ||
    toBillingMonthFromDate(dueDate) ||
    toBillingMonthFromDate(servicePeriodStart) ||
    toBillingMonthFromDate(rangeStart);

  const provider = inferProvider(mergedText, filename);

  return {
    provider,
    type: inferUtilityType(mergedText, filename),
    accountNumber,
    billingMonth,
    amount,
    dueDate,
    servicePeriodStart: servicePeriodStart || rangeStart,
    servicePeriodEnd: servicePeriodEnd || rangeEnd
  };
}

async function extractTextFromBuffer(buffer, mimeType = '', filename = '') {
  const normalizedMimeType = String(mimeType || '').toLowerCase();
  const normalizedFilename = String(filename || '').toLowerCase();

  const isPdf =
    normalizedMimeType.includes('pdf') || normalizedFilename.endsWith('.pdf');

  if (isPdf) {
    try {
      const parsed = await pdfParse(buffer);
      return String(parsed?.text || '');
    } catch {
      // Fall through to plain-text extraction for non-standard files.
    }
  }

  return buffer.toString('utf8');
}

function normalizeMonth(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return /^\d{4}-\d{2}$/.test(trimmed) ? trimmed : null;
}

function normalizeType(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().toLowerCase();
}

function normalizeSplitItems(splitItems = [], splitMethod = 'equal') {
  if (!Array.isArray(splitItems)) {
    return [];
  }

  return splitItems
    .filter((item) => item?.subPropertyId)
    .map((item) => {
      const base = {
        subPropertyId: String(item.subPropertyId),
        splitType: splitMethod === 'percentage' ? 'percentage' : 'equal'
      };

      if (base.splitType === 'percentage') {
        const pct = Number(item.percentage);
        base.percentage = Number.isFinite(pct) && pct >= 0 ? pct : 0;
      }

      return base;
    });
}

function normalizePayload(payload) {
  return {
    propertyId: payload.propertyId ? String(payload.propertyId) : null,
    type: normalizeType(payload.type) || 'other',
    provider: payload.provider || '',
    accountNumber: payload.accountNumber || '',
    billingMonth: normalizeMonth(payload.billingMonth),
    amount: Number(payload.amount),
    dueDate: payload.dueDate || null,
    paidDate: payload.paidDate || null,
    notes: payload.notes || '',
    attachmentIds: Array.isArray(payload.attachmentIds)
      ? payload.attachmentIds.map((id) => String(id))
      : [],
    splitMethod: payload.splitMethod === 'percentage' ? 'percentage' : 'equal',
    splitItems: normalizeSplitItems(payload.splitItems, payload.splitMethod)
  };
}

async function validatePayload(realmId, payload, utilityId = null) {
  if (!payload.propertyId) {
    return 'propertyId is required';
  }

  const property = await Collections.Property.findOne({
    _id: payload.propertyId,
    realmId
  }).lean();

  if (!property) {
    return 'propertyId must reference an existing property in this realm';
  }

  if (!payload.billingMonth) {
    return 'billingMonth must use YYYY-MM format';
  }

  if (!payload.type) {
    return 'type is required';
  }

  if (!Number.isFinite(payload.amount) || payload.amount < 0) {
    return 'amount must be a positive number';
  }

  if (payload.splitMethod === 'percentage' && payload.splitItems.length) {
    const percentageSum = payload.splitItems.reduce(
      (sum, item) => sum + (Number(item.percentage) || 0),
      0
    );

    if (percentageSum > 100.0001) {
      return 'split percentage cannot exceed 100';
    }
  }

  if (payload.attachmentIds.length) {
    const attachmentCount = await Collections.Attachment.countDocuments({
      _id: { $in: payload.attachmentIds },
      realmId,
      targetType: 'property',
      targetId: payload.propertyId,
      category: 'utility_bill'
    });

    if (attachmentCount !== payload.attachmentIds.length) {
      return 'All attachmentIds must be utility_bill files for this property';
    }
  }

  const uniquenessQuery = {
    realmId,
    propertyId: payload.propertyId,
    type: payload.type,
    billingMonth: payload.billingMonth
  };

  if (utilityId) {
    uniquenessQuery._id = { $ne: utilityId };
  }

  const duplicate = await Collections.Utility.findOne(uniquenessQuery).lean();
  if (duplicate) {
    return 'A utility entry already exists for this property, type, and month';
  }

  return null;
}

export async function all(req, res) {
  const realm = req.realm;
  const { propertyId, billingMonth, type } = req.query;

  const query = { realmId: realm._id };

  if (propertyId) {
    query.propertyId = String(propertyId);
  }

  if (billingMonth) {
    const parsed = normalizeMonth(String(billingMonth));
    if (!parsed) {
      return res
        .status(400)
        .json({ message: 'billingMonth must use YYYY-MM format' });
    }
    query.billingMonth = parsed;
  }

  if (type) {
    query.type = String(type);
  }

  const utilities = await Collections.Utility.find(query)
    .sort({ billingMonth: -1, createdAt: -1 })
    .lean();

  return res.json(utilities);
}

export async function one(req, res) {
  const realm = req.realm;
  const utility = await Collections.Utility.findOne({
    _id: req.params.id,
    realmId: realm._id
  }).lean();

  if (!utility) {
    return res.status(404).json({ message: 'Utility entry not found' });
  }

  return res.json(utility);
}

export async function add(req, res) {
  const realm = req.realm;
  const payload = normalizePayload(req.body || {});
  payload.lastUpdatedBy = _getUserFullName(req);

  const validationError = await validatePayload(realm._id, payload);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const utility = new Collections.Utility({
    realmId: realm._id,
    ...payload
  });

  await utility.save();

  await createLog(
    req,
    'create',
    'utility',
    utility._id,
    `${payload.type || ''} ${payload.billingMonth || ''}`.trim()
  );

  return res.status(201).json(utility.toObject());
}

export async function update(req, res) {
  const realm = req.realm;
  const utilityId = req.params.id;
  const payload = normalizePayload(req.body || {});
  payload.lastUpdatedBy = _getUserFullName(req);

  const validationError = await validatePayload(realm._id, payload, utilityId);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const oldUtility = await Collections.Utility.findOne({
    _id: utilityId,
    realmId: realm._id
  }).lean();

  const utility = await Collections.Utility.findOneAndUpdate(
    {
      _id: utilityId,
      realmId: realm._id
    },
    payload,
    { new: true }
  ).lean();

  if (!utility) {
    return res.status(404).json({ message: 'Utility entry not found' });
  }

  const changes = diffObjects(oldUtility, payload);
  await createLog(
    req,
    'update',
    'utility',
    utilityId,
    `${utility.type || ''} ${utility.billingMonth || ''}`.trim(),
    changes
  );

  return res.json(utility);
}

export async function remove(req, res) {
  const realm = req.realm;

  const existing = await Collections.Utility.findOne({
    _id: req.params.id,
    realmId: realm._id
  }).lean();

  const result = await Collections.Utility.deleteOne({
    _id: req.params.id,
    realmId: realm._id
  });

  if (result.deletedCount === 0) {
    return res.status(404).json({ message: 'Utility entry not found' });
  }

  if (existing) {
    await createLog(
      req,
      'delete',
      'utility',
      req.params.id,
      `${existing.type || ''} ${existing.billingMonth || ''}`.trim()
    );
  }

  return res.sendStatus(204);
}

export async function parseUpload(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'Missing file' });
  }

  const text = await extractTextFromBuffer(
    Buffer.from(req.file.buffer || ''),
    req.file.mimetype,
    req.file.originalname
  );

  const extracted = parseUtilityBillFields(text, req.file.originalname || '');

  const utilityAccounts = await Collections.UtilityAccount.find({
    realmId: req.realm._id
  })
    .select('_id accountNumber type provider allocations')
    .lean();

  const normalizedExtractedAccountNumber = normalizeAccountNumber(
    extracted.accountNumber
  );

  const matchedAccount = normalizedExtractedAccountNumber
    ? utilityAccounts.find(
        (utilityAccount) =>
          normalizeAccountNumber(utilityAccount.accountNumber) ===
          normalizedExtractedAccountNumber
      )
    : null;

  const hasAnyExtractedValue = Object.values(extracted).some(
    (value) => value !== null && value !== ''
  );

  const warnings = [];
  if (!hasAnyExtractedValue) {
    warnings.push(
      'No utility bill fields could be extracted. For image-only PDFs/photos, OCR is required and is not enabled in this environment.'
    );
  }
  if (extracted.accountNumber && !matchedAccount) {
    warnings.push(
      'Parsed account number did not match a saved utility account'
    );
  }
  if (!extracted.amount || extracted.amount <= 0) {
    warnings.push('Could not confidently parse bill amount');
  }
  if (!extracted.billingMonth) {
    warnings.push('Could not determine billing month');
  }

  return res.json({
    extracted,
    matchedAccount: matchedAccount
      ? {
          _id: String(matchedAccount._id),
          accountNumber: matchedAccount.accountNumber,
          type: matchedAccount.type,
          provider: matchedAccount.provider || '',
          allocations: matchedAccount.allocations || []
        }
      : null,
    warnings
  });
}
