/* eslint-disable sort-imports */
import { createLog, diffObjects } from './auditlogmanager.js';
import {
  Collections,
  Crypto,
  logger,
  ServiceError
} from '@microrealestate/common';
import { getUploadsDirectory } from '../utils/storage.js';
import axios from 'axios';
import fs from 'fs-extra';
import { nanoid } from 'nanoid';
import path from 'path';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

const SECRET_PLACEHOLDER = '**********';

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

function accountNumbersLikelyMatch(left, right) {
  const a = normalizeAccountNumber(left);
  const b = normalizeAccountNumber(right);

  if (!a || !b) {
    return false;
  }

  if (a === b) {
    return true;
  }

  const aNoLeadingZeros = a.replace(/^0+/, '');
  const bNoLeadingZeros = b.replace(/^0+/, '');
  if (
    aNoLeadingZeros &&
    bNoLeadingZeros &&
    aNoLeadingZeros === bNoLeadingZeros
  ) {
    return true;
  }

  const shorter = a.length <= b.length ? a : b;
  const longer = shorter === a ? b : a;

  // Some providers print both a short account number and a longer full token.
  if (shorter.length >= 8 && longer.startsWith(shorter)) {
    return true;
  }

  return false;
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

  const collapsed = raw.replace(/\s+/g, ' ').trim();

  const isoMatch = collapsed.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/);
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

  const usMatch = collapsed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
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

  const monthNameMatch = collapsed.match(
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

  const parsed = new Date(collapsed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

function parseBillingMonthValue(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  const normalized = raw.replace(/\s+/g, ' ').trim();

  const yearMonthMatch = normalized.match(/^(\d{4})[/.-](\d{1,2})$/);
  if (yearMonthMatch) {
    const year = Number(yearMonthMatch[1]);
    const month = Number(yearMonthMatch[2]);
    if (
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      month >= 1 &&
      month <= 12
    ) {
      return `${year}-${String(month).padStart(2, '0')}`;
    }
  }

  const monthYearMatch = normalized.match(
    /^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[,\s-]+(\d{4})$/i
  );
  if (monthYearMatch) {
    const monthToken = monthYearMatch[1].toLowerCase();
    const month =
      MONTH_NAMES[monthToken] || MONTH_NAMES[monthToken.slice(0, 3)] || null;
    const year = Number(monthYearMatch[2]);
    if (month && Number.isFinite(year)) {
      return `${year}-${month}`;
    }
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

function sanitizeAccountToken(raw) {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-z0-9./-]/gi, '')
    .replace(/[./]+$/g, '');

  if (!cleaned) {
    return '';
  }

  const digitCount = (cleaned.match(/\d/g) || []).length;
  if (digitCount < 5) {
    return '';
  }

  return cleaned;
}

function pickAccountFromLine(line) {
  const tokens = String(line || '').match(/[a-z0-9][a-z0-9./-]{3,40}/gi) || [];

  const filtered = tokens
    .map(sanitizeAccountToken)
    .filter(Boolean)
    .filter((token) => !/^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/.test(token));

  if (!filtered.length) {
    return '';
  }

  const withHyphen = filtered.find((token) => /-/.test(token));
  return withHyphen || filtered[0];
}

function extractAccountNumber(text, filename = '') {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim());

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) {
      continue;
    }

    const labelMatch = line.match(
      /^(?:account\s*(?:number|no\.?|#)|customer\s*(?:account|id)|acct\s*(?:number|no\.?|#)?)\s*[:#-]?\s*(.*)$/i
    );
    if (!labelMatch) {
      continue;
    }

    const inlineCandidate = pickAccountFromLine(labelMatch[1] || '');
    if (inlineCandidate) {
      return inlineCandidate;
    }

    for (let offset = 1; offset <= 4; offset += 1) {
      const nextLine = lines[i + offset] || '';
      if (!nextLine) {
        continue;
      }

      if (
        /^(service\s+address|service\s+period|amount\s+due|due\s+date)\b/i.test(
          nextLine
        )
      ) {
        break;
      }

      const candidate = pickAccountFromLine(nextLine);
      if (candidate) {
        return candidate;
      }
    }
  }

  const mergedText = `${String(filename || '')}\n${String(text || '')}`;
  const fallbackRaw = extractByPatterns(mergedText, [
    /account\s*(?:number|no\.?|#)\s*[:#-]?\s*([a-z0-9\-./ ]{4,60})/i,
    /customer\s*(?:account|id)\s*[:#-]?\s*([a-z0-9\-./ ]{4,60})/i
  ]);

  const fallback = pickAccountFromLine(fallbackRaw);
  return fallback || '';
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
    .replace(/[_\s-]+\d{1,2}[_\s-]+\d{1,2}\s*$/g, '')
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

  const accountNumber = extractAccountNumber(text, filename)
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9-]/gi, '')
    .slice(0, 40);

  const amountCandidate = extractByPatterns(mergedText, [
    /total\s*(?:amount\s*)?due(?:\s*(?:by|on)\s*\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})?\s*[:$]?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /pay\s*(?:this\s*)?amount\s*[:$-]?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /amount\s*due\s*[:$]?\s*([\d,]+(?:\.\d{2})?)/i,
    /current\s*charges?\s*[:$]?\s*([\d,]+(?:\.\d{2})?)/i,
    /new\s*charges?\s*[:$]?\s*([\d,]+(?:\.\d{2})?)/i,
    /balance\s*(?:forward|due)?\s*[:$]?\s*([\d,]+(?:\.\d{2})?)/i
  ]);
  const amount = parseCurrencyValue(amountCandidate);

  const dueDate = parseIsoDate(
    extractByPatterns(mergedText, [
      /(?:payment\s*)?due\s*date\s*[:#-]?\s*([^\n]+)/i,
      /pay\s*by\s*[:#-]?\s*([^\n]+)/i,
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
    /(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{4}[/.-]\d{1,2}[/.-]\d{1,2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})\s*(?:to|through|-)\s*(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{4}[/.-]\d{1,2}[/.-]\d{1,2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})/i
  );

  const rangeStart = serviceRangeMatch
    ? parseIsoDate(serviceRangeMatch[1])
    : null;
  const rangeEnd = serviceRangeMatch
    ? parseIsoDate(serviceRangeMatch[2])
    : null;

  const explicitBillingMonth = parseBillingMonthValue(
    extractByPatterns(mergedText, [
      /billing\s*(?:month|period)\s*[:#-]?\s*([^\n]+)/i,
      /service\s*(?:month|period)\s*[:#-]?\s*([^\n]+)/i
    ])
  );

  const billingMonth =
    explicitBillingMonth ||
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
  const status = payload.status === 'pending' ? 'pending' : 'confirmed';
  const source = payload.source === 'email' ? 'email' : 'manual';

  return {
    propertyId: payload.propertyId ? String(payload.propertyId) : null,
    type: normalizeType(payload.type) || 'other',
    provider: payload.provider || '',
    accountNumber: payload.accountNumber || '',
    billingMonth: normalizeMonth(payload.billingMonth),
    amount: Number(payload.amount),
    originalAmount: Number(payload.amount),
    dueDate: payload.dueDate || null,
    paidDate: payload.paidDate || null,
    notes: payload.notes || '',
    attachmentIds: Array.isArray(payload.attachmentIds)
      ? payload.attachmentIds.map((id) => String(id))
      : [],
    status,
    source,
    confirmationNumber: String(payload.confirmationNumber || '').trim(),
    emailMessageId: String(payload.emailMessageId || '').trim(),
    importIssues: Array.isArray(payload.importIssues)
      ? payload.importIssues.map((issue) => String(issue)).filter(Boolean)
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
    // Accept any realm attachment regardless of targetType (PDF, email text, etc.)
    const attachmentCount = await Collections.Attachment.countDocuments({
      _id: { $in: payload.attachmentIds },
      realmId
    });

    if (attachmentCount !== payload.attachmentIds.length) {
      return 'All attachmentIds must be valid attachments in this organization';
    }
  }

  const uniquenessQuery = {
    realmId,
    propertyId: payload.propertyId,
    type: payload.type,
    billingMonth: payload.billingMonth,
    status: payload.status || 'confirmed'
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
  const { propertyId, billingMonth, type, status, source } = req.query;

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

  if (status) {
    const normalizedStatus = String(status).toLowerCase();
    if (!['pending', 'confirmed'].includes(normalizedStatus)) {
      return res.status(400).json({ message: 'status must be pending or confirmed' });
    }
    query.status = normalizedStatus;
  }

  if (source) {
    const normalizedSource = String(source).toLowerCase();
    if (!['manual', 'email'].includes(normalizedSource)) {
      return res.status(400).json({ message: 'source must be manual or email' });
    }
    query.source = normalizedSource;
  }

  const utilities = await Collections.Utility.find(query)
    .sort({ billingMonth: -1, createdAt: -1 })
    .lean();

  // Embed attachment metadata so the UI can render file lists without extra round-trips
  const allAttachmentIds = utilities.flatMap((u) => u.attachmentIds || []);
  let attachmentMap = new Map();
  if (allAttachmentIds.length) {
    const attachments = await Collections.Attachment.find({
      _id: { $in: allAttachmentIds },
      realmId: realm._id
    })
      .select('_id filename mimeType category size uploadedByName createdAt')
      .lean();
    attachmentMap = new Map(attachments.map((a) => [String(a._id), a]));
  }

  // Build sibling map: records sharing accountNumber+type+billingMonth show each other's property
  const allPropertyIds = [...new Set(utilities.map((u) => String(u.propertyId)))];
  const properties = await Collections.Property.find({ _id: { $in: allPropertyIds }, realmId: realm._id })
    .select('_id name')
    .lean();
  const propertyNameById = new Map(properties.map((p) => [String(p._id), p.name || '']));

  const billKey = (u) => `${u.accountNumber}|${u.type}|${u.billingMonth}`;
  const billGroups = new Map();
  for (const u of utilities) {
    const k = billKey(u);
    if (!billGroups.has(k)) billGroups.set(k, []);
    billGroups.get(k).push(u);
  }

  return res.json(
    utilities.map((utility) => {
      const siblings = (billGroups.get(billKey(utility)) || [])
        .filter((s) => String(s._id) !== String(utility._id))
        .map((s) => ({ propertyId: String(s.propertyId), name: propertyNameById.get(String(s.propertyId)) || '' }));
      return {
        ...utility,
        attachments: (utility.attachmentIds || [])
          .map((id) => attachmentMap.get(String(id)))
          .filter(Boolean),
        siblingProperties: siblings
      };
    })
  );
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
  payload.billEnteredBy = _getUserFullName(req);
  payload.billEnteredAt = new Date();

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

  const oldUtility = await Collections.Utility.findOne({
    _id: utilityId,
    realmId: realm._id
  }).lean();

  if (oldUtility?.invoicedAt) {
    return res
      .status(409)
      .json({ message: 'Cannot edit a utility bill that has already been invoiced' });
  }

  // Preserve the original amount recorded when the bill was first entered
  if (oldUtility?.originalAmount != null) {
    payload.originalAmount = oldUtility.originalAmount;
  }

  const validationError = await validatePayload(realm._id, payload, utilityId);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

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
    ? utilityAccounts.find((utilityAccount) =>
        accountNumbersLikelyMatch(
          utilityAccount.accountNumber,
          normalizedExtractedAccountNumber
        )
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

function assertAdministrator(req) {
  if (req.user?.role !== 'administrator') {
    throw new ServiceError('only administrator can manage utility email import', 403);
  }
}

function splitEmails(value) {
  if (Array.isArray(value)) {
    return value
      .map((email) => String(email || '').trim().toLowerCase())
      .filter(Boolean);
  }

  return String(value || '')
    .split(/[;,\n]/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeUtilitiesInboxGraphConfig(payload = {}) {
  return {
    selected: !!payload.selected,
    tenantId: String(payload.tenantId || '').trim(),
    clientId: String(payload.clientId || '').trim(),
    mailboxEmail: String(payload.mailboxEmail || '').trim().toLowerCase(),
    notificationEmails: splitEmails(payload.notificationEmails),
    pollingEnabled: payload.pollingEnabled !== false,
    pollingHourUtc: Number.isFinite(Number(payload.pollingHourUtc))
      ? Math.min(23, Math.max(0, Number(payload.pollingHourUtc)))
      : 6
  };
}

function getUtilitiesInboxGraphConfigForResponse(realm = {}) {
  const config = realm.thirdParties?.utilitiesInboxGraph || {};

  return {
    selected: !!config.selected,
    tenantId: config.tenantId || '',
    clientId: config.clientId || '',
    clientSecret: config.clientSecret ? SECRET_PLACEHOLDER : '',
    mailboxEmail: config.mailboxEmail || '',
    notificationEmails: Array.isArray(config.notificationEmails)
      ? config.notificationEmails
      : [],
    pollingEnabled: config.pollingEnabled !== false,
    pollingHourUtc:
      Number.isFinite(Number(config.pollingHourUtc))
        ? Number(config.pollingHourUtc)
        : 6,
    hasClientSecret: !!config.clientSecret,
    lastSuccessfulSyncAt: config.lastSuccessfulSyncAt || null,
    lastSyncAt: config.lastSyncAt || null,
    lastSyncError: config.lastSyncError || ''
  };
}

function getUtilitiesInboxGraphConfigForImport(realm = {}) {
  const config = realm.thirdParties?.utilitiesInboxGraph || {};

  return {
    selected: !!config.selected,
    tenantId: String(config.tenantId || '').trim(),
    clientId: String(config.clientId || '').trim(),
    clientSecret: config.clientSecret
      ? Crypto.decrypt(config.clientSecret)
      : '',
    mailboxEmail: String(config.mailboxEmail || '').trim().toLowerCase(),
    notificationEmails: Array.isArray(config.notificationEmails)
      ? config.notificationEmails
      : [],
    pollingEnabled: config.pollingEnabled !== false,
    pollingHourUtc:
      Number.isFinite(Number(config.pollingHourUtc))
        ? Number(config.pollingHourUtc)
        : 6,
    lastSuccessfulSyncAt: config.lastSuccessfulSyncAt || null,
    lastSyncAt: config.lastSyncAt || null,
    lastSyncError: config.lastSyncError || ''
  };
}

function validateRequiredGraphFields(config, hasSecret) {
  if (!config.tenantId || !config.clientId || !config.mailboxEmail) {
    throw new ServiceError(
      'tenantId, clientId and mailboxEmail are required',
      422
    );
  }

  if (!hasSecret) {
    throw new ServiceError('clientSecret is required', 422);
  }
}

async function getGraphAccessToken(config) {
  const tokenEndpoint = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append('client_id', config.clientId);
  params.append('client_secret', config.clientSecret);
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('grant_type', 'client_credentials');

  const response = await axios.post(tokenEndpoint, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  return response.data?.access_token || '';
}

async function listGraphInboxMessages(config, { top = 25 } = {}) {
  const token = await getGraphAccessToken(config);

  const response = await axios.get(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.mailboxEmail)}/mailFolders/inbox/messages`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        $top: top,
        $orderby: 'receivedDateTime desc',
        $select:
          'id,internetMessageId,subject,receivedDateTime,from,body,bodyPreview'
      }
    }
  );

  return Array.isArray(response.data?.value) ? response.data.value : [];
}

async function fetchGraphMessageById(config, graphMessageId) {
  const token = await getGraphAccessToken(config);
  const response = await axios.get(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.mailboxEmail)}/messages/${encodeURIComponent(graphMessageId)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      params: { $select: 'id,internetMessageId,subject,receivedDateTime,from,body,bodyPreview' }
    }
  );
  return response.data || null;
}

function htmlToPlainText(html = '') {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseNwNaturalPayment(messageText = '') {
  const confirmationNumber = extractByPatterns(messageText, [
    /confirmation\s*number\s*[:#-]?\s*([a-z0-9-]+)/i
  ]);
  const paymentDate = parseIsoDate(
    extractByPatterns(messageText, [/payment\s*date\s*[:#-]?\s*([^\n]+)/i])
  );
  const dueDate = parseIsoDate(
    extractByPatterns(messageText, [/date\s*due\s*[:#-]?\s*([^\n]+)/i])
  );
  const amount = parseCurrencyValue(
    extractByPatterns(messageText, [
      /payment\s*amount\s*[:$-]?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i,
      /total\s*amount\s*charged\s*[:$-]?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i
    ])
  );
  const paymentStatus = extractByPatterns(messageText, [
    /payment\s*status\s*[:#-]?\s*([a-z]+)/i
  ]);
  const accountNumber = extractByPatterns(messageText, [
    /account\s*number\s*[:#-]?\s*([*x\-\d]+)/i
  ]);

  return {
    provider: 'NW Natural',
    type: 'gas',
    confirmationNumber,
    paymentDate,
    dueDate,
    amount,
    paymentStatus,
    accountNumber
  };
}

function parseOregonCityStatement(messageText = '') {
  const confirmationNumber = extractByPatterns(messageText, [
    /authorization\s*code\s*[:#-]?\s*([a-z0-9-]+)/i,
    /confirmation\s*number\s*[:#-]?\s*([a-z0-9-]+)/i
  ]);

  const amount = parseCurrencyValue(
    extractByPatterns(messageText, [
      /account\s*balance\s*[:$-]?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i,
      /charged\s+your\s+credit\s+card\s+in\s+the\s+amount\s+of\s+\$?\s*([\d,]+(?:\.\d{2})?)/i
    ])
  );
  const dueDate = parseIsoDate(
    extractByPatterns(messageText, [/due\s*date\s*[:#-]?\s*([^\n]+)/i])
  );
  const accountNumber = extractByPatterns(messageText, [
    /account\s*number\s*[:#-]?\s*([*x\-\d]+)/i
  ]);

  return {
    provider: 'Oregon City',
    type: 'water',
    confirmationNumber,
    paymentDate: '',
    dueDate,
    amount,
    paymentStatus: '',
    accountNumber
  };
}

function parsePaymentConfirmationMessage(message = {}) {
  const fromEmail = String(message?.from?.emailAddress?.address || '').toLowerCase();
  const subject = String(message?.subject || '');
  const body = String(message?.body?.content || '');
  const bodyText = message?.body?.contentType === 'html' ? htmlToPlainText(body) : String(body || '');
  const combinedText = `${subject}\n${bodyText}`;

  const issues = [];
  let parsed;

  if (
    fromEmail.includes('nwnatural.com') ||
    /payment\s*confirmation\s*-\s*nw\s*natural/i.test(subject)
  ) {
    parsed = parseNwNaturalPayment(combinedText);
  } else if (
    /online\s*bill\s*pay\s*-\s*statement\s*notification/i.test(subject) ||
    /oregon\s*city\s*utility/i.test(combinedText)
  ) {
    parsed = parseOregonCityStatement(combinedText);
  } else {
    return null;
  }

  if (!parsed.confirmationNumber) {
    issues.push('missing_confirmation_number');
  }
  if (!parsed.paymentDate) {
    issues.push('missing_payment_date');
  }
  if (!parsed.amount || parsed.amount <= 0) {
    issues.push('missing_amount');
  }
  if (!parsed.accountNumber) {
    issues.push('missing_account_number');
  }

  return {
    ...parsed,
    subject,
    fromEmail,
    emailMessageId: String(message?.id || message?.internetMessageId || ''),
    receivedDateTime: String(message?.receivedDateTime || ''),
    rawText: combinedText,
    issues
  };
}

function normalizeAccountForSuffixMatch(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/^[x*]+/g, '');
}

function accountNumbersMatchWithMask(savedAccountNumber, parsedAccountNumber) {
  if (accountNumbersLikelyMatch(savedAccountNumber, parsedAccountNumber)) {
    return true;
  }

  const saved = normalizeAccountForSuffixMatch(savedAccountNumber);
  const parsed = normalizeAccountForSuffixMatch(parsedAccountNumber);

  if (!saved || !parsed) {
    return false;
  }

  if (parsed.length >= 4 && saved.endsWith(parsed)) {
    return true;
  }

  if (saved.length >= 4 && parsed.endsWith(saved)) {
    return true;
  }

  return false;
}

async function saveRawEmailAttachment({ realmId, utilityId, reqUser, rawText, provider, accountNumber, billingMonth }) {
  const uploadDir = getUploadsDirectory('attachments');

  const safeAccount = String(accountNumber || utilityId).replace(/[^a-zA-Z0-9-]/g, '_');
  const safeMonth = String(billingMonth || 'unknown').replace(/[^0-9-]/g, '_');
  const storageKey = `utility_bills/${safeAccount}/${safeMonth}/${nanoid(16)}`;
  const filePath = path.join(uploadDir, storageKey);
  await fs.ensureDir(path.dirname(filePath));
  const fileContent = String(rawText || '');
  await fs.writeFile(filePath, fileContent, 'utf8');

  const uploadedById =
    reqUser?._id || reqUser?.email || reqUser?.clientId || 'utility-email-import';
  const uploadedByName = reqUser?.firstname
    ? `${reqUser.firstname} ${reqUser.lastname || ''}`.trim()
    : reqUser?.email || 'Utility Email Import';

  const attachment = new Collections.Attachment({
    realmId,
    targetType: 'utility',
    targetId: String(utilityId),
    storageKey,
    filename: `utility-email-${String(provider || 'import').toLowerCase().replace(/\s+/g, '-')}.txt`,
    mimeType: 'text/plain',
    size: Buffer.byteLength(fileContent),
    category: 'other',
    uploadedById,
    uploadedByName,
    backupStatus: 'pending'
  });

  await attachment.save();
  return String(attachment._id);
}

async function importParsedMessage({ realmId, reqUser, parsedMessage, utilityAccounts }) {
  const result = {
    created: [],
    duplicates: [],
    issues: []
  };

  const paidDateIso = parsedMessage.paymentDate || parsedMessage.receivedDateTime;
  const paidDate = parseIsoDate(paidDateIso);
  const dueDate = parseIsoDate(parsedMessage.dueDate);
  const billingMonth =
    toBillingMonthFromDate(paidDate) ||
    toBillingMonthFromDate(dueDate) ||
    toBillingMonthFromDate(parseIsoDate(parsedMessage.receivedDateTime)) ||
    new Date().toISOString().slice(0, 7);

  if (!billingMonth) {
    result.issues.push('missing_billing_month');
    return result;
  }

  const duplicateByMessageId = parsedMessage.emailMessageId
    ? await Collections.Utility.findOne({
        realmId,
        emailMessageId: parsedMessage.emailMessageId,
        source: 'email'
      })
        .select('_id')
        .lean()
    : null;

  if (duplicateByMessageId) {
    result.duplicates.push('duplicate_message_id');
    return result;
  }

  if (parsedMessage.confirmationNumber && paidDate) {
    const start = new Date(`${paidDate}T00:00:00.000Z`);
    const end = new Date(`${paidDate}T23:59:59.999Z`);
    const duplicateByConfirmation = await Collections.Utility.findOne({
      realmId,
      confirmationNumber: parsedMessage.confirmationNumber,
      paidDate: { $gte: start, $lte: end },
      source: 'email'
    })
      .select('_id')
      .lean();

    if (duplicateByConfirmation) {
      result.duplicates.push('duplicate_confirmation_number');
      return result;
    }
  }

  const candidateAccounts = utilityAccounts.filter((utilityAccount) => {
    if (parsedMessage.type && normalizeType(utilityAccount.type) !== normalizeType(parsedMessage.type)) {
      return false;
    }

    return accountNumbersMatchWithMask(
      utilityAccount.accountNumber,
      parsedMessage.accountNumber
    );
  });

  if (candidateAccounts.length !== 1) {
    result.issues.push(
      candidateAccounts.length === 0
        ? 'no_matching_utility_account'
        : 'ambiguous_account_match'
    );
    return result;
  }

  const matchedAccount = candidateAccounts[0];
  const allocations = Array.isArray(matchedAccount.allocations)
    ? matchedAccount.allocations.filter((allocation) => allocation?.propertyId)
    : [];

  if (!allocations.length) {
    result.issues.push('missing_utility_account_allocations');
    return result;
  }

  const totalAmount = Number(parsedMessage.amount || 0);
  let distributedAmount = 0;

  for (let index = 0; index < allocations.length; index += 1) {
    const allocation = allocations[index];
    const isLast = index === allocations.length - 1;
    const amount = isLast
      ? Number((totalAmount - distributedAmount).toFixed(2))
      : Number(((totalAmount * Number(allocation.percentage || 0)) / 100).toFixed(2));

    distributedAmount += amount;

    const existingPending = await Collections.Utility.findOne({
      realmId,
      propertyId: String(allocation.propertyId),
      type: normalizeType(matchedAccount.type),
      billingMonth,
      status: 'pending',
      source: 'email',
      confirmationNumber: parsedMessage.confirmationNumber || ''
    })
      .select('_id')
      .lean();

    if (existingPending) {
      continue;
    }

    // Skip if this bill was already manually confirmed for any property sharing the same account
    const existingConfirmed = await Collections.Utility.findOne({
      realmId,
      accountNumber: matchedAccount.accountNumber,
      type: normalizeType(matchedAccount.type),
      billingMonth,
      status: 'confirmed'
    })
      .select('_id')
      .lean();

    if (existingConfirmed) {
      continue;
    }

    const utility = new Collections.Utility({
      realmId,
      propertyId: String(allocation.propertyId),
      type: normalizeType(matchedAccount.type),
      provider: matchedAccount.provider || parsedMessage.provider || '',
      accountNumber: matchedAccount.accountNumber || parsedMessage.accountNumber,
      billingMonth,
      amount,
      // Store the full bill total so the split table can show "Full bill: $X"
      originalAmount: totalAmount,
      splitTotal: totalAmount,
      dueDate: dueDate ? new Date(`${dueDate}T00:00:00.000Z`) : null,
      paidDate: paidDate ? new Date(`${paidDate}T00:00:00.000Z`) : null,
      notes: `Imported from mailbox: ${parsedMessage.subject}`,
      attachmentIds: [],
      status: 'pending',
      source: 'email',
      confirmationNumber: parsedMessage.confirmationNumber || '',
      emailMessageId: parsedMessage.emailMessageId || '',
      importIssues: parsedMessage.issues,
      splitMethod: 'equal',
      splitItems: [],
      lastUpdatedBy: _getUserFullName({ user: reqUser })
    });

    await utility.save();

    const emailAttachmentId = await saveRawEmailAttachment({
      realmId,
      utilityId: utility._id,
      reqUser,
      rawText: parsedMessage.rawText,
      provider: parsedMessage.provider,
      accountNumber: utility.accountNumber,
      billingMonth: utility.billingMonth
    });

    utility.attachmentIds = [emailAttachmentId];
    await utility.save();

    await createLog(
      { user: reqUser, realm: { _id: realmId } },
      'create',
      'utility',
      utility._id,
      `${utility.type || ''} ${utility.billingMonth || ''}`.trim()
    );

    result.created.push(String(utility._id));
  }

  if (!result.created.length && !result.issues.length) {
    result.duplicates.push('duplicate_pending_entry');
  }

  return result;
}

function getUtcDateKey(value = new Date()) {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function escapeHtml(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendGraphNotificationEmail(config, recipients = [], message = {}) {
  if (!recipients.length) {
    return;
  }

  const token = await getGraphAccessToken(config);
  await axios.post(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.mailboxEmail)}/sendMail`,
    {
      message: {
        subject: String(message.subject || 'Utilities email import notification'),
        body: {
          contentType: 'HTML',
          content: String(message.htmlBody || '')
        },
        toRecipients: recipients.map((email) => ({
          emailAddress: { address: email }
        }))
      },
      saveToSentItems: true
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
}

async function sendImportFailureNotification({ realm, config, summary }) {
  const recipients = Array.isArray(config.notificationEmails)
    ? config.notificationEmails.filter(Boolean)
    : [];

  if (!recipients.length || !summary.failed) {
    return;
  }

  const lines = summary.failures
    .slice(0, 25)
    .map(
      (failure) =>
        `<li><strong>${escapeHtml(failure.subject || 'Unknown subject')}</strong> (${escapeHtml(
          failure.accountNumber || 'n/a'
        )}) - ${escapeHtml((failure.issues || []).join(', '))}</li>`
    )
    .join('');

  const htmlBody = `
    <p>Utilities inbox import completed with failures.</p>
    <p><strong>Organization:</strong> ${escapeHtml(realm.name || '')}</p>
    <p><strong>Checked:</strong> ${summary.checked} | <strong>Parsed:</strong> ${summary.parsed} | <strong>Created:</strong> ${summary.created} | <strong>Duplicates:</strong> ${summary.duplicates} | <strong>Failed:</strong> ${summary.failed}</p>
    <p><strong>Top failures:</strong></p>
    <ul>${lines || '<li>No failure details</li>'}</ul>
  `;

  await sendGraphNotificationEmail(config, recipients, {
    subject: `Utilities import warnings (${summary.failed}) - ${realm.name}`,
    htmlBody
  });
}

async function runImportForRealm({ realm, reqUser, limit = 50 }) {
  const config = getUtilitiesInboxGraphConfigForImport(realm);
  validateRequiredGraphFields(config, !!config.clientSecret);

  const summary = {
    checked: 0,
    parsed: 0,
    created: 0,
    duplicates: 0,
    failed: 0,
    failures: []
  };

  const messages = await listGraphInboxMessages(config, {
    top: Math.min(100, Math.max(1, Number(limit || 50)))
  });

  const utilityAccounts = await Collections.UtilityAccount.find({
    realmId: realm._id
  })
    .select('_id type provider accountNumber allocations')
    .lean();

  summary.checked = messages.length;

  for (const message of messages) {
    const parsed = parsePaymentConfirmationMessage(message);
    if (!parsed) {
      continue;
    }

    summary.parsed += 1;

    const importResult = await importParsedMessage({
      realmId: realm._id,
      reqUser,
      parsedMessage: parsed,
      utilityAccounts
    });

    summary.created += importResult.created.length;
    summary.duplicates += importResult.duplicates.length;

    if (importResult.issues.length) {
      summary.failed += 1;
      summary.failures.push({
        subject: parsed.subject,
        accountNumber: parsed.accountNumber,
        issues: importResult.issues
      });
    }
  }

  return { summary, config };
}

function shouldRunScheduledImport(config) {
  if (!config.selected || config.pollingEnabled === false) {
    return false;
  }

  const now = new Date();
  const targetHour = Number(config.pollingHourUtc ?? 6);

  if (now.getUTCHours() !== targetHour) {
    return false;
  }

  const lastSyncAt = config.lastSyncAt ? new Date(config.lastSyncAt) : null;
  if (!lastSyncAt || Number.isNaN(lastSyncAt.getTime())) {
    return true;
  }

  return getUtcDateKey(now) !== getUtcDateKey(lastSyncAt);
}

async function deleteUtilityAttachments(utility = {}) {
  const attachmentIds = Array.isArray(utility.attachmentIds)
    ? utility.attachmentIds.map((id) => String(id))
    : [];

  if (!attachmentIds.length) {
    return;
  }

  const attachments = await Collections.Attachment.find({
    _id: { $in: attachmentIds },
    targetType: 'utility',
    targetId: String(utility._id)
  }).lean();

  for (const attachment of attachments) {
    const filePath = getUploadsDirectory('attachments', attachment.storageKey);

    try {
      const exists = await fs.pathExists(filePath);
      if (exists) {
        await fs.remove(filePath);
      }
    } catch (error) {
      logger.warn(
        `Unable to remove utility attachment file ${attachment.storageKey}: ${error.message}`
      );
    }
  }

  await Collections.Attachment.deleteMany({
    _id: { $in: attachments.map((attachment) => attachment._id) }
  });
}

export async function getEmailConnection(req, res) {
  assertAdministrator(req);
  const realm = await Collections.Realm.findOne({ _id: req.realm._id }).lean();
  if (!realm) {
    throw new ServiceError('organization not found', 404);
  }

  return res.json(getUtilitiesInboxGraphConfigForResponse(realm));
}

export async function upsertEmailConnection(req, res) {
  assertAdministrator(req);

  const realm = await Collections.Realm.findOne({ _id: req.realm._id });
  if (!realm) {
    throw new ServiceError('organization not found', 404);
  }

  const current = realm.thirdParties?.utilitiesInboxGraph || {};
  const normalized = normalizeUtilitiesInboxGraphConfig(req.body || {});
  const clientSecretUpdated = !!req.body?.clientSecretUpdated;

  const hasSecret = clientSecretUpdated
    ? !!String(req.body?.clientSecret || '').trim()
    : !!current.clientSecret;

  validateRequiredGraphFields(normalized, hasSecret);

  const encryptedSecret = clientSecretUpdated
    ? Crypto.encrypt(String(req.body?.clientSecret || '').trim())
    : current.clientSecret || '';

  if (!realm.thirdParties) {
    realm.thirdParties = {};
  }

  realm.thirdParties.utilitiesInboxGraph = {
    ...current,
    ...normalized,
    clientSecret: encryptedSecret
  };

  await realm.save();

  return res.json(getUtilitiesInboxGraphConfigForResponse(realm.toObject()));
}

export async function testEmailConnection(req, res) {
  assertAdministrator(req);

  const realm = await Collections.Realm.findOne({ _id: req.realm._id });
  if (!realm) {
    throw new ServiceError('organization not found', 404);
  }

  const config = getUtilitiesInboxGraphConfigForImport(realm.toObject());
  validateRequiredGraphFields(config, !!config.clientSecret);

  try {
    const messages = await listGraphInboxMessages(config, { top: 1 });
    return res.json({
      success: true,
      mailboxEmail: config.mailboxEmail,
      messageCountChecked: messages.length
    });
  } catch (error) {
    const message = error.response?.data?.error?.message || error.message;
    return res.status(400).json({ success: false, message });
  }
}

export async function importEmailConfirmations(req, res) {
  assertAdministrator(req);

  const realm = await Collections.Realm.findOne({ _id: req.realm._id });
  if (!realm) {
    throw new ServiceError('organization not found', 404);
  }

  try {
    const { summary, config } = await runImportForRealm({
      realm: realm.toObject(),
      reqUser: req.user,
      limit: req.body?.limit || 50
    });

    if (!realm.thirdParties) {
      realm.thirdParties = {};
    }

    realm.thirdParties.utilitiesInboxGraph = {
      ...(realm.thirdParties.utilitiesInboxGraph || {}),
      lastSuccessfulSyncAt: new Date(),
      lastSyncAt: new Date(),
      lastSyncError: ''
    };
    await realm.save();

    if (summary.failed) {
      try {
        await sendImportFailureNotification({
          realm: realm.toObject(),
          config,
          summary
        });
      } catch (notifyError) {
        logger.warn(
          `Utility import notification failed for realm ${realm._id}: ${notifyError.message}`
        );
      }
    }

    return res.json(summary);
  } catch (error) {
    const message = error.response?.data?.error?.message || error.message;
    if (!realm.thirdParties) {
      realm.thirdParties = {};
    }

    realm.thirdParties.utilitiesInboxGraph = {
      ...(realm.thirdParties.utilitiesInboxGraph || {}),
      lastSyncAt: new Date(),
      lastSyncError: message
    };
    await realm.save();

    return res.status(400).json({ message });
  }
}

export async function approvePendingConfirmation(req, res) {
  assertAdministrator(req);

  const utility = await Collections.Utility.findOne({
    _id: req.params.id,
    realmId: req.realm._id
  });

  if (!utility) {
    return res.status(404).json({ message: 'Utility entry not found' });
  }

  if (utility.status !== 'pending' || utility.source !== 'email') {
    return res
      .status(400)
      .json({ message: 'Only pending email-import utilities can be approved' });
  }

  const previous = utility.toObject();
  utility.status = 'confirmed';
  utility.lastUpdatedBy = _getUserFullName(req);
  await utility.save();

  await createLog(
    req,
    'update',
    'utility',
    utility._id,
    `${utility.type || ''} ${utility.billingMonth || ''}`.trim(),
    diffObjects(previous, { ...previous, status: 'confirmed' })
  );

  return res.json(utility.toObject());
}

export async function rejectPendingConfirmation(req, res) {
  assertAdministrator(req);

  const utility = await Collections.Utility.findOne({
    _id: req.params.id,
    realmId: req.realm._id
  });

  if (!utility) {
    return res.status(404).json({ message: 'Utility entry not found' });
  }

  if (utility.status !== 'pending' || utility.source !== 'email') {
    return res
      .status(400)
      .json({ message: 'Only pending email-import utilities can be rejected' });
  }

  const snapshot = utility.toObject();
  await deleteUtilityAttachments(snapshot);
  await Collections.Utility.deleteOne({ _id: utility._id, realmId: req.realm._id });

  await createLog(
    req,
    'delete',
    'utility',
    utility._id,
    `${utility.type || ''} ${utility.billingMonth || ''}`.trim()
  );

  return res.sendStatus(204);
}

export async function recaptureEmailBill(req, res) {
  const realmId = req.realm._id;
  const utilityId = req.params.id;

  const utility = await Collections.Utility.findOne({ _id: utilityId, realmId }).lean();
  if (!utility) {
    return res.status(404).json({ message: 'Utility entry not found' });
  }

  if (utility.source !== 'email' || !utility.emailMessageId) {
    return res.status(400).json({
      message: 'Manual re-upload required — this bill was not imported from email'
    });
  }

  // Check if the existing attachment file is already on disk (idempotent)
  if ((utility.attachmentIds || []).length) {
    const existingAttachment = await Collections.Attachment.findOne({
      _id: utility.attachmentIds[0],
      realmId
    }).lean();
    if (existingAttachment) {
      const filePath = getUploadsDirectory('attachments', existingAttachment.storageKey);
      const alreadyExists = await fs.pathExists(filePath);
      if (alreadyExists) {
        return res.json({ message: 'Bill file already present', restored: false });
      }
    }
  }

  const realm = await Collections.Realm.findOne({ _id: realmId }).lean();
  const graphConfig = getUtilitiesInboxGraphConfigForImport(realm);

  if (!graphConfig.selected || !graphConfig.clientSecret) {
    return res.status(400).json({
      message: 'Email inbox not configured — re-upload the bill manually'
    });
  }

  let message;
  try {
    message = await fetchGraphMessageById(graphConfig, utility.emailMessageId);
  } catch {
    return res.status(502).json({
      message: 'Could not fetch email from inbox — re-upload the bill manually'
    });
  }

  if (!message) {
    return res.status(404).json({
      message: 'Original email not found in inbox — re-upload the bill manually'
    });
  }

  const bodyContent = message.body?.content || message.bodyPreview || '';
  const rawText =
    message.body?.contentType === 'html'
      ? htmlToPlainText(bodyContent)
      : bodyContent;

  // Remove broken attachment records before creating a fresh one
  if ((utility.attachmentIds || []).length) {
    await Collections.Attachment.deleteMany({
      _id: { $in: utility.attachmentIds },
      realmId
    });
  }

  const newAttachmentId = await saveRawEmailAttachment({
    realmId,
    utilityId: utility._id,
    reqUser: req.user,
    rawText,
    provider: utility.provider,
    accountNumber: utility.accountNumber,
    billingMonth: utility.billingMonth
  });

  await Collections.Utility.updateOne(
    { _id: utilityId, realmId },
    { attachmentIds: [newAttachmentId] }
  );

  return res.json({ message: 'Bill restored from email', restored: true, attachmentId: newAttachmentId });
}

export async function recaptureAllEmailBills(req, res) {
  const realmId = req.realm._id;

  const emailUtilities = await Collections.Utility.find({
    realmId,
    source: 'email',
    emailMessageId: { $ne: '' }
  }).lean();

  if (!emailUtilities.length) {
    return res.json({ restored: 0, alreadyPresent: 0, skipped: 0, failed: 0 });
  }

  const realm = await Collections.Realm.findOne({ _id: realmId }).lean();
  const graphConfig = getUtilitiesInboxGraphConfigForImport(realm);

  if (!graphConfig.selected || !graphConfig.clientSecret) {
    return res.status(400).json({
      message: 'Email inbox not configured — recapture requires a working email connection'
    });
  }

  const summary = { restored: 0, alreadyPresent: 0, skipped: 0, failed: 0 };

  for (const utility of emailUtilities) {
    try {
      // Check if the existing file is already on disk
      if ((utility.attachmentIds || []).length) {
        const existingAttachment = await Collections.Attachment.findOne({
          _id: utility.attachmentIds[0],
          realmId
        }).lean();
        if (existingAttachment) {
          const filePath = getUploadsDirectory('attachments', existingAttachment.storageKey);
          const alreadyExists = await fs.pathExists(filePath);
          if (alreadyExists) {
            summary.alreadyPresent++;
            continue;
          }
        }
      }

      let message;
      try {
        message = await fetchGraphMessageById(graphConfig, utility.emailMessageId);
      } catch {
        summary.failed++;
        continue;
      }

      if (!message) {
        summary.failed++;
        continue;
      }

      const bodyContent = message.body?.content || message.bodyPreview || '';
      const rawText =
        message.body?.contentType === 'html'
          ? htmlToPlainText(bodyContent)
          : bodyContent;

      if ((utility.attachmentIds || []).length) {
        await Collections.Attachment.deleteMany({
          _id: { $in: utility.attachmentIds },
          realmId
        });
      }

      const newAttachmentId = await saveRawEmailAttachment({
        realmId,
        utilityId: utility._id,
        reqUser: req.user,
        rawText,
        provider: utility.provider,
        accountNumber: utility.accountNumber,
        billingMonth: utility.billingMonth
      });

      await Collections.Utility.updateOne(
        { _id: utility._id, realmId },
        { attachmentIds: [newAttachmentId] }
      );

      summary.restored++;
    } catch {
      summary.failed++;
    }
  }

  return res.json(summary);
}

export async function backfillOriginalAmount(req, res) {
  const realmId = req.realm._id;

  // Fix existing email-imported records where originalAmount was never set.
  // Groups by accountNumber+type+billingMonth and uses the sum of amounts as the total.
  const emailRecords = await Collections.Utility.find({
    realmId,
    source: 'email',
    originalAmount: null
  }).lean();

  if (!emailRecords.length) {
    return res.json({ updated: 0 });
  }

  // Group siblings by account+type+month to sum the total
  const groups = new Map();
  for (const u of emailRecords) {
    const key = `${u.accountNumber}|${u.type}|${u.billingMonth}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(u);
  }

  let updated = 0;
  for (const records of groups.values()) {
    const total = records.reduce((sum, u) => sum + (u.amount || 0), 0);
    const roundedTotal = Number(total.toFixed(2));
    for (const u of records) {
      await Collections.Utility.updateOne(
        { _id: u._id, realmId },
        { originalAmount: roundedTotal, splitTotal: roundedTotal }
      );
      updated++;
    }
  }

  return res.json({ updated });
}

export async function deduplicateUtilities(req, res) {
  const realmId = req.realm._id;

  // Find all manually-entered confirmed records — these are authoritative
  const manualConfirmed = await Collections.Utility.find({
    realmId,
    status: 'confirmed',
    source: 'manual'
  })
    .select('accountNumber type billingMonth')
    .lean();

  if (!manualConfirmed.length) {
    return res.json({ deleted: 0, groups: 0 });
  }

  // Build fingerprint set from manually-confirmed records that have an account number
  const manualKeys = new Set(
    manualConfirmed
      .filter((u) => u.accountNumber)
      .map((u) => `${u.accountNumber}|${u.type}|${u.billingMonth}`)
  );

  // Find ALL email-imported records (any status) for the same account+type+month
  const emailRecords = await Collections.Utility.find({
    realmId,
    source: 'email',
    accountNumber: { $ne: '' }
  }).lean();

  const toDelete = emailRecords.filter((u) =>
    manualKeys.has(`${u.accountNumber}|${u.type}|${u.billingMonth}`)
  );

  let deleted = 0;
  for (const dup of toDelete) {
    const attachments = await Collections.Attachment.find({
      _id: { $in: dup.attachmentIds || [] },
      realmId
    }).lean();
    for (const att of attachments) {
      const filePath = getUploadsDirectory('attachments', att.storageKey);
      await fs.remove(filePath).catch(() => {});
    }
    await Collections.Attachment.deleteMany({
      _id: { $in: dup.attachmentIds || [] },
      realmId
    });
    await Collections.Utility.deleteOne({ _id: dup._id, realmId });
    deleted++;
  }

  const groupsAffected = new Set(
    toDelete.map((u) => `${u.accountNumber}|${u.type}|${u.billingMonth}`)
  ).size;

  return res.json({ deleted, groups: groupsAffected });
}

export async function attachBillScan(req, res) {
  const realmId = req.realm._id;

  if (!req.file) {
    return res.status(400).json({ message: 'Missing file' });
  }

  // Parse the PDF to extract account number and billing month
  const text = await extractTextFromBuffer(
    Buffer.from(req.file.buffer || ''),
    req.file.mimetype,
    req.file.originalname
  );
  const extracted = parseUtilityBillFields(text, req.file.originalname || '');

  const utilityAccounts = await Collections.UtilityAccount.find({ realmId })
    .select('_id accountNumber type provider')
    .lean();

  const normalizedExtracted = normalizeAccountNumber(extracted.accountNumber);
  const matchedAccount = normalizedExtracted
    ? utilityAccounts.find((ua) =>
        accountNumbersLikelyMatch(ua.accountNumber, normalizedExtracted)
      )
    : null;

  const billingMonth = extracted.billingMonth || String(req.body.billingMonth || '').trim();
  const accountNumber = extracted.accountNumber || String(req.body.accountNumber || '').trim();

  // Find existing utility records that match and are missing a file
  const query = { realmId };
  if (billingMonth) query.billingMonth = billingMonth;
  if (matchedAccount) {
    query.accountNumber = matchedAccount.accountNumber;
  } else if (accountNumber) {
    query.accountNumber = { $regex: accountNumber.replace(/\*/g, ''), $options: 'i' };
  }

  const candidates = await Collections.Utility.find(query).lean();
  const overwrite = req.body.overwrite === 'true' || req.body.overwrite === true;

  const results = [];
  for (const utility of candidates) {
    const existingIds = utility.attachmentIds || [];

    // Identify only existing PDF attachments — email text files are always kept
    const existingPdfs = existingIds.length
      ? await Collections.Attachment.find({
          _id: { $in: existingIds },
          realmId,
          mimeType: { $regex: 'pdf', $options: 'i' }
        })
          .select('_id')
          .lean()
      : [];

    if (existingPdfs.length && !overwrite) {
      results.push({ utilityId: String(utility._id), status: 'skipped_has_pdf' });
      continue;
    }

    const uploadDir = getUploadsDirectory('attachments');
    const safeAccount = String(utility.accountNumber || utility._id).replace(/[^a-zA-Z0-9-]/g, '_');
    const safeMonth = String(utility.billingMonth || 'unknown').replace(/[^0-9-]/g, '_');
    const storageKey = `utility_bills/${safeAccount}/${safeMonth}/${nanoid(16)}`;
    const filePath = path.join(uploadDir, storageKey);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, req.file.buffer);

    const uploadedById = req.user?._id || req.user?.email || 'manual-scan-upload';
    const uploadedByName = req.user?.firstname
      ? `${req.user.firstname} ${req.user.lastname || ''}`.trim()
      : req.user?.email || 'Manual Scan Upload';

    // When overwriting, remove only old PDFs — preserve email text files
    const existingPdfIds = new Set(existingPdfs.map((a) => String(a._id)));
    if (existingPdfIds.size) {
      await Collections.Attachment.deleteMany({ _id: { $in: [...existingPdfIds] }, realmId });
    }
    const keptIds = existingIds.filter((id) => !existingPdfIds.has(String(id)));

    const attachment = new Collections.Attachment({
      realmId,
      targetType: 'utility',
      targetId: String(utility._id),
      storageKey,
      filename: req.file.originalname,
      mimeType: req.file.mimetype || 'application/pdf',
      size: req.file.size || req.file.buffer?.length || 0,
      category: 'utility_bill',
      uploadedById,
      uploadedByName,
      backupStatus: 'pending'
    });
    await attachment.save();

    await Collections.Utility.updateOne(
      { _id: utility._id, realmId },
      { attachmentIds: [...keptIds, String(attachment._id)], lastUpdatedBy: uploadedByName }
    );

    results.push({ utilityId: String(utility._id), status: 'attached', attachmentId: String(attachment._id) });
  }

  return res.json({
    extracted,
    matchedAccount: matchedAccount ? { _id: String(matchedAccount._id), accountNumber: matchedAccount.accountNumber } : null,
    results,
    noMatch: candidates.length === 0
  });
}

let utilityImportSchedulerHandle = null;

export function startUtilityImportScheduler() {
  if (utilityImportSchedulerHandle) {
    return;
  }

  const runTick = async () => {
    try {
      const realms = await Collections.Realm.find({
        'thirdParties.utilitiesInboxGraph.selected': true,
        'thirdParties.utilitiesInboxGraph.pollingEnabled': { $ne: false }
      }).lean();

      for (const realm of realms) {
        const config = getUtilitiesInboxGraphConfigForImport(realm);
        if (!shouldRunScheduledImport(config)) {
          continue;
        }

        try {
          const { summary, config: resolvedConfig } = await runImportForRealm({
            realm,
            reqUser: {
              email: 'utility-email-scheduler@system.local',
              firstname: 'Utility',
              lastname: 'Scheduler'
            },
            limit: 50
          });

          await Collections.Realm.updateOne(
            { _id: realm._id },
            {
              $set: {
                'thirdParties.utilitiesInboxGraph.lastSuccessfulSyncAt':
                  new Date(),
                'thirdParties.utilitiesInboxGraph.lastSyncAt': new Date(),
                'thirdParties.utilitiesInboxGraph.lastSyncError': ''
              }
            }
          );

          if (summary.failed) {
            try {
              await sendImportFailureNotification({
                realm,
                config: resolvedConfig,
                summary
              });
            } catch (notifyError) {
              logger.warn(
                `Utility scheduler notification failed for realm ${realm._id}: ${notifyError.message}`
              );
            }
          }

          logger.info(
            `Utility import scheduler processed realm ${realm._id}: created=${summary.created}, failed=${summary.failed}`
          );
        } catch (error) {
          const message = error.response?.data?.error?.message || error.message;
          await Collections.Realm.updateOne(
            { _id: realm._id },
            {
              $set: {
                'thirdParties.utilitiesInboxGraph.lastSyncAt': new Date(),
                'thirdParties.utilitiesInboxGraph.lastSyncError': message
              }
            }
          );
          logger.error(
            `Utility import scheduler failed for realm ${realm._id}: ${message}`
          );
        }
      }
    } catch (error) {
      logger.error(`Utility import scheduler tick failed: ${error.message}`);
    }
  };

  utilityImportSchedulerHandle = setInterval(runTick, 15 * 60 * 1000);
  runTick().catch((error) => {
    logger.error(`Utility import scheduler initial run failed: ${error.message}`);
  });
  logger.info('Utility email import scheduler started (15 minute interval)');
}

export function stopUtilityImportScheduler() {
  if (!utilityImportSchedulerHandle) {
    return;
  }
  clearInterval(utilityImportSchedulerHandle);
  utilityImportSchedulerHandle = null;
}
