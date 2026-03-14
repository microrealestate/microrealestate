import { Collections } from '@microrealestate/common';
import fs from 'fs-extra';
import { Parser } from 'json2csv';
import path from 'path';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

function normalizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function normalizeNumber(value, defaultValue = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function roundCurrency(value) {
  return Number((Number(value || 0) + Number.EPSILON).toFixed(2));
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeUnitSplits(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item?.subPropertyId)
    .map((item) => ({
      subPropertyId: String(item.subPropertyId),
      percentage: normalizeNumber(item.percentage)
    }));
}

function normalizePaymentConfirmations(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item?.paidOn)
    .map((item) => ({
      paidOn: normalizeDate(item.paidOn),
      paidAmount: normalizeNumber(item.paidAmount),
      feeAmount: normalizeNumber(item.feeAmount),
      paymentMethod: normalizeText(item.paymentMethod),
      confirmationNumber: normalizeText(item.confirmationNumber),
      notes: normalizeText(item.notes),
      attachmentIds: Array.isArray(item.attachmentIds)
        ? item.attachmentIds.map((id) => String(id))
        : [],
      createdAt: normalizeDate(item.createdAt) || new Date(),
      createdBy: normalizeText(item.createdBy)
    }))
    .filter((item) => item.paidOn);
}

function parseNumberFromText(text, patterns = []) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) {
      continue;
    }

    const normalized = String(match[1])
      .replace(/[$,\s]/g, '')
      .replace(/[()]/g, '');
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function parseStringFromText(text, patterns = []) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return String(match[1]).trim();
    }
  }

  return '';
}

function getNonEmptyLines(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function cleanInlineValue(value) {
  return String(value || '')
    .replace(/^[\s:.-]+/, '')
    .replace(/[|]+$/g, '')
    .trim();
}

function normalizeToken(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function toIsoDateString(value) {
  if (!value) {
    return '';
  }

  const raw = String(value)
    .trim()
    .replace(/[.,;:]$/, '');

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
    const yearPart = Number(usMatch[3]);
    const year = usMatch[3].length === 2 ? 2000 + yearPart : yearPart;

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

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime()) && /[a-z]/i.test(raw) && /\d/.test(raw)) {
    return parsed.toISOString().slice(0, 10);
  }

  return '';
}

function parseLabeledValue(text, patterns = []) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) {
      continue;
    }

    const value = String(match[1]).trim().replace(/[|]+$/g, '').trim();
    if (value) {
      return value;
    }
  }

  return '';
}

function isLikelyMonthYearValue(value) {
  const normalized = String(value || '').trim();
  return (
    /^(0?[1-9]|1[0-2])[/-](19|20)\d{2}$/.test(normalized) ||
    /^(19|20)\d{2}[/-](0?[1-9]|1[0-2])$/.test(normalized)
  );
}

function isLikelyFullDateValue(value) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return false;
  }

  if (
    /^(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})$/.test(
      normalized
    )
  ) {
    return true;
  }

  return /^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4}$/i.test(
    normalized
  );
}

function isValidAccountNumber(value) {
  const normalized = normalizeToken(value).replace(/\s/g, '');
  if (!/^[a-z0-9]{4,12}$/i.test(normalized)) {
    return false;
  }

  if (!/^(?:r\d{4,11}|\d{4,12})$/i.test(normalized)) {
    return false;
  }

  return true;
}

function isValidMapNumber(value) {
  const normalized = normalizeToken(value).replace(/\s/g, '');
  if (!/^[a-z0-9-]{3,30}$/i.test(normalized)) {
    return false;
  }

  if (!/\d/.test(normalized)) {
    return false;
  }

  const hasLetters = /[a-z]/i.test(normalized);
  const hasHyphen = normalized.includes('-');
  if (!hasLetters && !hasHyphen) {
    return false;
  }

  if (/^(?:r?\d{4,12})$/i.test(normalized)) {
    return false;
  }

  if (isLikelyMonthYearValue(normalized) || isLikelyFullDateValue(normalized)) {
    return false;
  }

  if (/(account|acres|situs|code|total|tax)/i.test(normalized)) {
    return false;
  }

  return true;
}

function parseAccountNumberFromText(text) {
  const previousLinePattern = text.match(
    /(?:^|\n)\s*([a-z0-9-]{3,24})\s*\n\s*(?:tax\s*)?account\s*(?:number|no\.?|#)?\s*:?/im
  );
  if (
    previousLinePattern?.[1] &&
    isValidAccountNumber(previousLinePattern[1])
  ) {
    return normalizeToken(previousLinePattern[1]).replace(/\s/g, '');
  }

  const inline = parseLabeledValue(text, [
    /(?:^|\n)\s*account\s*(?:number|no\.?|#)?\s*[:-]?\s*([a-z0-9]{4,12})\s*(?=$|\n)/im,
    /(?:^|\n)\s*tax\s*account\s*(?:number|no\.?|#)?\s*[:-]?\s*([a-z0-9]{4,12})\s*(?=$|\n)/im,
    /(?:^|\n)\s*([a-z0-9]{4,12})\s*account\s*(?:number|no\.?|#)?\s*:?/im
  ]);
  if (isValidAccountNumber(inline)) {
    return normalizeToken(inline).replace(/\s/g, '');
  }

  const lines = getNonEmptyLines(text);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!/account\s*(?:number|no\.?|#)/i.test(line)) {
      continue;
    }

    const previousLine = lines[index - 1] || '';
    const previousToken = previousLine.split(/\s+/)[0] || '';
    if (isValidAccountNumber(previousToken)) {
      return normalizeToken(previousToken).replace(/\s/g, '');
    }

    const inlineMatch = line.match(
      /account\s*(?:number|no\.?|#)?\s*[:-]?\s*([a-z0-9]{4,12})/i
    );
    if (inlineMatch?.[1] && isValidAccountNumber(inlineMatch[1])) {
      return normalizeToken(inlineMatch[1]).replace(/\s/g, '');
    }

    const nextLine = lines[index + 1] || '';
    const nextToken = nextLine.split(/\s+/)[0] || '';
    if (isValidAccountNumber(nextToken)) {
      return normalizeToken(nextToken).replace(/\s/g, '');
    }
  }

  return '';
}

function parseMapNumberFromText(text) {
  const inline = parseLabeledValue(text, [
    /(?:^|\n)\s*map\s*(?:number|no\.?|#)?\s*[:-]?\s*([a-z0-9-]{3,30})\s*(?=$|\n)/im,
    /(?:^|\n)\s*(?:tax\s*map|map\s*id)\s*[:-]?\s*([a-z0-9-]{3,30})\s*(?=$|\n)/im
  ]);
  if (isValidMapNumber(inline)) {
    return normalizeToken(inline).replace(/\s/g, '');
  }

  const lines = getNonEmptyLines(text);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!/^map\s*(?:number|no\.?|#)?\s*:?$/i.test(line)) {
      continue;
    }

    for (let offset = 1; offset <= 20; offset += 1) {
      const candidateLine = cleanInlineValue(lines[index + offset] || '');
      if (!candidateLine) {
        continue;
      }

      if (/\b(acres|situs)\b/i.test(candidateLine)) {
        continue;
      }

      const token =
        candidateLine.match(
          /\b(?=[a-z0-9-]{5,30}\b)(?=[a-z0-9-]*[a-z])(?=[a-z0-9-]*\d)[a-z0-9-]+\b/i
        )?.[0] ||
        candidateLine.match(/[a-z0-9-]{3,30}/i)?.[0] ||
        candidateLine.split(/\s+/)[0] ||
        '';
      if (isValidMapNumber(token)) {
        return normalizeToken(token).replace(/\s/g, '');
      }

      // Stop scanning when another strong section starts; prevents drifting
      // too far from the MAP block in noisy OCR output.
      if (
        /^(code|tear here|please include|make check payable|payment options)/i.test(
          candidateLine
        )
      ) {
        break;
      }
    }
  }

  return '';
}

function parseDateRangeFromText(text) {
  const monthName =
    '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';

  const rangePatterns = [
    /(?:tax\s*)?period[^\n]*?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})\s*(?:to|through|-)\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})/i,
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})\s*(?:to|through|-)\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})/i,
    new RegExp(
      `(${monthName}\\s+\\d{1,2},?\\s+\\d{2,4})\\s*(?:to|through|-)\\s*(${monthName}\\s+\\d{1,2},?\\s+\\d{2,4})`,
      'i'
    )
  ];

  for (const pattern of rangePatterns) {
    const match = text.match(pattern);
    if (!match) {
      continue;
    }

    const periodStart = toIsoDateString(match[1]);
    const periodEnd = toIsoDateString(match[2]);
    if (periodStart || periodEnd) {
      return {
        periodStart: periodStart || null,
        periodEnd: periodEnd || null
      };
    }
  }

  let periodStart = toIsoDateString(
    parseLabeledValue(text, [
      /(?:period\s*)?start\s*date\s*[:-]?\s*([^\n]+)/i,
      /period\s*from\s*[:-]?\s*([^\n]+)/i
    ])
  );
  let periodEnd = toIsoDateString(
    parseLabeledValue(text, [
      /(?:period\s*)?end\s*date\s*[:-]?\s*([^\n]+)/i,
      /period\s*(?:to|through)\s*[:-]?\s*([^\n]+)/i
    ])
  );

  if (!periodStart || !periodEnd) {
    const lines = getNonEmptyLines(text);
    for (const line of lines) {
      const match = line.match(
        new RegExp(
          `(${monthName}\\s+\\d{1,2},?\\s+\\d{2,4}|\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}|\\d{4}[/-]\\d{1,2}[/-]\\d{1,2})\\s*(?:to|through|-)\\s*(${monthName}\\s+\\d{1,2},?\\s+\\d{2,4}|\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}|\\d{4}[/-]\\d{1,2}[/-]\\d{1,2})`,
          'i'
        )
      );
      if (!match) {
        continue;
      }

      const startCandidate = toIsoDateString(match[1]);
      const endCandidate = toIsoDateString(match[2]);
      if (startCandidate && !periodStart) {
        periodStart = startCandidate;
      }
      if (endCandidate && !periodEnd) {
        periodEnd = endCandidate;
      }
      if (periodStart && periodEnd) {
        break;
      }
    }
  }

  return {
    periodStart: periodStart || null,
    periodEnd: periodEnd || null
  };
}

function parseSingleNumber(value) {
  const parsed = Number(String(value || '').replace(/[$,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseConcatenatedPair(value) {
  const compact = String(value || '').replace(/\s/g, '');
  if (!compact) {
    return [null, null];
  }

  const decimalPair = compact.match(
    /^(\d{1,3}(?:,\d{3})+\.\d{2})(\d{1,3}(?:,\d{3})+\.\d{2})$/
  );
  if (decimalPair) {
    return [
      parseSingleNumber(decimalPair[1]),
      parseSingleNumber(decimalPair[2])
    ];
  }

  const integerPair = compact.match(
    /^(\d{1,3}(?:,\d{3})+)(\d{1,3}(?:,\d{3})+)$/
  );
  if (integerPair) {
    return [
      parseSingleNumber(integerPair[1]),
      parseSingleNumber(integerPair[2])
    ];
  }

  const candidates = String(value || '').match(/\d{1,3}(?:,\d{3})*(?:\.\d+)?/g);
  if (candidates?.length >= 2) {
    return [parseSingleNumber(candidates[0]), parseSingleNumber(candidates[1])];
  }

  return [null, null];
}

function parsePairedNumbersByLabel(text, labelPatterns = []) {
  for (const pattern of labelPatterns) {
    const match = text.match(pattern);
    if (!match) {
      continue;
    }

    const [left, right] = parseConcatenatedPair(match[1] || '');
    if (left !== null || right !== null) {
      return [left, right];
    }
  }

  return [null, null];
}

function parseRmvAndTaxTableFallback(text) {
  const lines = getNonEmptyLines(text);
  const tableStartIndex = lines.findIndex((line) =>
    /last\s*year\s*this\s*year|last\s*yearthis\s*year/i.test(line)
  );

  if (tableStartIndex === -1) {
    return null;
  }

  const numericValues = [];
  for (let index = tableStartIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (
      /please make payment to|property description|payment options|tax payment options/i.test(
        line
      )
    ) {
      break;
    }

    if (
      numericValues.length >= 12 &&
      /po box|total due|property tax statement|questions about/i.test(line)
    ) {
      break;
    }

    const lineValues = line.match(/\d{1,3}(?:,\d{3})*(?:\.\d+)?/g) || [];
    lineValues.forEach((value) => {
      const parsed = parseSingleNumber(value);
      if (parsed !== null) {
        numericValues.push(parsed);
      }
    });
  }

  if (numericValues.length < 10) {
    return null;
  }

  const primaryValues = numericValues.slice(0, 14);

  const decimalIndexes = primaryValues
    .map((value, idx) => ({ value, idx }))
    .filter(({ value }) => value % 1 !== 0);

  if (decimalIndexes.length < 2) {
    return null;
  }

  const firstTaxIndex = decimalIndexes[decimalIndexes.length - 2].idx;
  const lastTaxIndex = decimalIndexes[decimalIndexes.length - 1].idx;

  const findNearestIntegerBefore = (fromIndex) => {
    for (let idx = fromIndex - 1; idx >= 0; idx -= 1) {
      const value = primaryValues[idx];
      if (Number.isFinite(value) && value % 1 === 0) {
        return value;
      }
    }
    return null;
  };

  return {
    rmvLandLastYear: primaryValues[0] ?? null,
    rmvBuildingLastYear: primaryValues[1] ?? null,
    rmvTotalLastYear: primaryValues[2] ?? null,
    rmvLandThisYear: primaryValues[3] ?? null,
    rmvBuildingThisYear: primaryValues[4] ?? null,
    rmvTotalThisYear: primaryValues[5] ?? null,
    assessedValueLastYear: findNearestIntegerBefore(firstTaxIndex),
    assessedValueThisYear: findNearestIntegerBefore(lastTaxIndex),
    propertyTaxesLastYear: primaryValues[firstTaxIndex] ?? null,
    propertyTaxesThisYear: primaryValues[lastTaxIndex] ?? null
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

function buildTaxReportRow(statement) {
  const confirmations = Array.isArray(statement.paymentConfirmations)
    ? statement.paymentConfirmations
    : [];
  const totalDue = Number(statement.totalAfterDiscount || 0);
  const totalPaid = confirmations.reduce(
    (sum, confirmation) => sum + Number(confirmation.paidAmount || 0),
    0
  );
  const totalFees = confirmations.reduce(
    (sum, confirmation) => sum + Number(confirmation.feeAmount || 0),
    0
  );
  const signedBalance = roundCurrency(totalDue - totalPaid);
  const balance = Math.max(0, signedBalance);
  const overpaidAmount = Math.max(0, -signedBalance);

  let status = 'unpaid';
  if (totalDue > 0 && signedBalance < -0.01) {
    status = 'overpaid';
  } else if (totalDue > 0 && Math.abs(signedBalance) <= 0.01) {
    status = 'paid';
  } else if (totalPaid > 0) {
    status = 'partial';
  }

  const lastPaymentDate = confirmations
    .map((confirmation) => String(confirmation.paidOn || ''))
    .filter(Boolean)
    .sort((left, right) => right.localeCompare(left))[0];

  return {
    statementId: String(statement._id),
    propertyId: String(statement.propertyId || ''),
    taxYearLabel: String(statement.taxYearLabel || ''),
    totalDue,
    totalPaid,
    totalFees,
    balance,
    signedBalance,
    overpaidAmount,
    status,
    confirmationsCount: confirmations.length,
    lastPaymentDate: lastPaymentDate ? lastPaymentDate.slice(0, 10) : ''
  };
}

async function loadAttachmentForParsing(realmId, statementId, attachmentId) {
  const attachment = await Collections.Attachment.findOne({
    _id: attachmentId,
    realmId,
    targetType: 'property_tax_statement',
    targetId: statementId
  }).lean();

  if (!attachment) {
    return null;
  }

  const filePath = path.resolve(
    process.cwd(),
    'data',
    'uploads',
    'attachments',
    attachment.storageKey
  );
  const exists = await fs.pathExists(filePath);
  if (!exists) {
    return null;
  }

  const buffer = await fs.readFile(filePath);

  const text = await extractTextFromBuffer(
    buffer,
    attachment.mimeType,
    attachment.filename
  );

  return { attachment, text };
}

export function parseTaxStatementFields(text, filename = '') {
  const mergedText = `${String(filename)}\n${String(text || '')}`;
  const tableFallback = parseRmvAndTaxTableFallback(mergedText);

  const { periodStart, periodEnd } = parseDateRangeFromText(mergedText);
  const [rmvLandLastYear, rmvLandThisYear] = parsePairedNumbersByLabel(
    mergedText,
    [/rmv\s*land\s*:?[\s]*([^\n]+)/i]
  );
  const [rmvBuildingLastYear, rmvBuildingThisYear] = parsePairedNumbersByLabel(
    mergedText,
    [/rmv\s*(?:building|bldg)\s*:?[\s]*([^\n]+)/i]
  );
  const [rmvTotalLastYear, rmvTotalThisYear] = parsePairedNumbersByLabel(
    mergedText,
    [/rmv\s*total\s*:?[\s]*([^\n]+)/i]
  );
  const [assessedValueLastYear, assessedValueThisYear] =
    parsePairedNumbersByLabel(mergedText, [
      /assessed\s*value(?:s)?\s*:?[\s]*([^\n]+)/i
    ]);
  const [propertyTaxesLastYear, propertyTaxesThisYear] =
    parsePairedNumbersByLabel(mergedText, [
      /property\s*tax(?:es)?\s*:?[\s]*([^\n]+)/i
    ]);

  let taxYearLabel =
    parseStringFromText(mergedText, [/\b(20\d{2}\s*-\s*20\d{2})\b/i]) ||
    parseStringFromText(mergedText, [/\b(20\d{2})\b/]);

  if (periodStart && periodEnd) {
    const startYear = new Date(periodStart).getUTCFullYear();
    const endYear = new Date(periodEnd).getUTCFullYear();
    const hasSingleYear = /^20\d{2}$/.test(String(taxYearLabel || '').trim());

    if (!taxYearLabel || hasSingleYear) {
      if (
        Number.isFinite(startYear) &&
        Number.isFinite(endYear) &&
        endYear >= startYear
      ) {
        taxYearLabel = `${startYear}-${endYear}`;
      }
    }
  }

  const accountNumber = parseAccountNumberFromText(mergedText);
  const mapNumber = parseMapNumberFromText(mergedText);

  const countyFromLabel = parseStringFromText(mergedText, [
    /county\s*(?:name)?\s*[:-]?\s*([a-z][a-z .'-]{2,})/i,
    /county\s+of\s+([a-z][a-z .'-]{2,})/i
  ]);
  const countyFromSuffix = parseStringFromText(mergedText, [
    /\b([a-z][a-z .'-]{2,}\s+county)\b/i
  ]);
  const county = normalizeText(countyFromSuffix || countyFromLabel);

  const resolvedPropertyTaxesLastYear =
    propertyTaxesLastYear !== null &&
    propertyTaxesThisYear !== null &&
    propertyTaxesThisYear > 100
      ? propertyTaxesLastYear
      : (tableFallback?.propertyTaxesLastYear ?? propertyTaxesLastYear ?? null);

  const resolvedPropertyTaxesThisYear =
    propertyTaxesLastYear !== null &&
    propertyTaxesThisYear !== null &&
    propertyTaxesThisYear > 100
      ? propertyTaxesThisYear
      : (tableFallback?.propertyTaxesThisYear ?? propertyTaxesThisYear ?? null);

  const taxBeforeDiscount =
    parseNumberFromText(mergedText, [
      /tax\s*before\s*discount\s*[:$]?\s*([\d,.]+)/i,
      /total\s*tax(?:es)?\s*[:$]?\s*([\d,.]+)/i,
      /((?:\d{1,3}(?:,\d{3})+|\d+)\.\d{2})\s*(?:20\d{2}\s*[-]?\s*20\d{2}\s*)?tax\s*\(\s*before\s*discount\s*\)/i
    ]) ||
    resolvedPropertyTaxesThisYear ||
    null;

  const totalAfterDiscount =
    parseNumberFromText(mergedText, [
      /total\s*after\s*discount\s*[:$]?\s*([\d,.]+)/i,
      /total\s*\(\s*after\s*discount\s*\)\s*[:$]?\s*([\d,.]+)/i,
      /amount\s*due\s*[:$]?\s*([\d,.]+)/i,
      /([\d,.]+)\s*total\s*due\s*\(\s*after\s*discount\s*\)/i
    ]) || null;

  return {
    taxYearLabel,
    periodStart,
    periodEnd,
    county,
    accountNumber,
    mapNumber,
    rmvLandLastYear: rmvLandLastYear ?? tableFallback?.rmvLandLastYear ?? null,
    rmvLandThisYear: rmvLandThisYear ?? tableFallback?.rmvLandThisYear ?? null,
    rmvBuildingLastYear:
      rmvBuildingLastYear ?? tableFallback?.rmvBuildingLastYear ?? null,
    rmvBuildingThisYear:
      rmvBuildingThisYear ?? tableFallback?.rmvBuildingThisYear ?? null,
    rmvTotalLastYear:
      rmvTotalLastYear ?? tableFallback?.rmvTotalLastYear ?? null,
    rmvTotalThisYear:
      rmvTotalThisYear ?? tableFallback?.rmvTotalThisYear ?? null,
    assessedValueLastYear:
      assessedValueLastYear ?? tableFallback?.assessedValueLastYear ?? null,
    assessedValueThisYear:
      assessedValueThisYear ?? tableFallback?.assessedValueThisYear ?? null,
    propertyTaxesLastYear: resolvedPropertyTaxesLastYear,
    propertyTaxesThisYear: resolvedPropertyTaxesThisYear,
    taxBeforeDiscount,
    delinquentTaxes: parseNumberFromText(mergedText, [
      /delinquent\s*tax(?:es)?\s*[:$]?\s*([\d,.]+)/i
    ]),
    totalAfterDiscount
  };
}

function normalizePayload(payload) {
  const taxBeforeDiscount = normalizeNumber(payload.taxBeforeDiscount);
  const delinquentTaxes = normalizeNumber(payload.delinquentTaxes);
  const totalAfterDiscount = normalizeNumber(
    payload.totalAfterDiscount,
    taxBeforeDiscount + delinquentTaxes
  );
  const estimatedIncreasePercentage = normalizeNumber(
    payload.estimatedIncreasePercentage
  );
  const estimatedNextYearTotal = roundCurrency(
    payload.estimatedNextYearTotal !== undefined &&
      payload.estimatedNextYearTotal !== null
      ? normalizeNumber(payload.estimatedNextYearTotal)
      : totalAfterDiscount * (1 + estimatedIncreasePercentage / 100)
  );
  const estimatedMonthlyCost = roundCurrency(
    payload.estimatedMonthlyCost !== undefined &&
      payload.estimatedMonthlyCost !== null
      ? normalizeNumber(payload.estimatedMonthlyCost)
      : estimatedNextYearTotal / 12
  );
  const priorYearEstimatedTotal =
    payload.priorYearEstimatedTotal === undefined ||
    payload.priorYearEstimatedTotal === null ||
    payload.priorYearEstimatedTotal === ''
      ? null
      : normalizeNumber(payload.priorYearEstimatedTotal);

  return {
    propertyId: payload.propertyId ? String(payload.propertyId) : null,
    taxYearLabel: normalizeText(payload.taxYearLabel),
    periodStart: normalizeDate(payload.periodStart),
    periodEnd: normalizeDate(payload.periodEnd),
    county: normalizeText(payload.county),
    accountNumber: normalizeText(payload.accountNumber),
    mapNumber: normalizeText(payload.mapNumber),
    rmvLandLastYear: normalizeNumber(payload.rmvLandLastYear),
    rmvLandThisYear: normalizeNumber(payload.rmvLandThisYear),
    rmvBuildingLastYear: normalizeNumber(payload.rmvBuildingLastYear),
    rmvBuildingThisYear: normalizeNumber(payload.rmvBuildingThisYear),
    rmvTotalLastYear: normalizeNumber(payload.rmvTotalLastYear),
    rmvTotalThisYear: normalizeNumber(payload.rmvTotalThisYear),
    assessedValueLastYear: normalizeNumber(payload.assessedValueLastYear),
    assessedValueThisYear: normalizeNumber(payload.assessedValueThisYear),
    propertyTaxesLastYear: normalizeNumber(payload.propertyTaxesLastYear),
    propertyTaxesThisYear: normalizeNumber(payload.propertyTaxesThisYear),
    taxBeforeDiscount,
    delinquentTaxes,
    totalAfterDiscount,
    landLeasedPercentage: normalizeNumber(payload.landLeasedPercentage, 100),
    buildingUnitSplits: normalizeUnitSplits(payload.buildingUnitSplits),
    landUnitSplits: normalizeUnitSplits(payload.landUnitSplits),
    estimatedIncreasePercentage,
    estimatedNextYearTotal,
    estimatedMonthlyCost,
    priorYearEstimatedTotal,
    priorYearVariance:
      priorYearEstimatedTotal === null
        ? null
        : roundCurrency(totalAfterDiscount - priorYearEstimatedTotal),
    notes: normalizeText(payload.notes),
    attachmentIds: Array.isArray(payload.attachmentIds)
      ? payload.attachmentIds.map((id) => String(id))
      : [],
    paymentConfirmations: normalizePaymentConfirmations(
      payload.paymentConfirmations
    )
  };
}

async function validateSplitItems(realmId, propertyId, splitItems, label) {
  if (!splitItems.length) {
    return null;
  }

  const subPropertyIds = splitItems.map((item) => item.subPropertyId);
  const uniqueSubPropertyIds = new Set(subPropertyIds);

  if (uniqueSubPropertyIds.size !== subPropertyIds.length) {
    return `${label} split cannot contain duplicate sub properties`;
  }

  if (
    splitItems.some(
      (item) => !Number.isFinite(item.percentage) || item.percentage < 0
    )
  ) {
    return `${label} split percentages must be valid non-negative numbers`;
  }

  const sum = splitItems.reduce(
    (accumulator, item) => accumulator + Number(item.percentage || 0),
    0
  );

  if (Math.abs(sum - 100) > 0.01) {
    return `${label} split percentages must add up to 100`;
  }

  const subProperties = await Collections.Property.find({
    _id: { $in: Array.from(uniqueSubPropertyIds) },
    realmId,
    parentPropertyId: propertyId
  })
    .select('_id')
    .lean();

  if (subProperties.length !== uniqueSubPropertyIds.size) {
    return `${label} split sub properties must belong to the selected property`;
  }

  return null;
}

async function validatePayload(realmId, payload, existingStatementId = null) {
  if (!payload.propertyId) {
    return 'propertyId is required';
  }

  const property = await Collections.Property.findOne({
    _id: payload.propertyId,
    realmId
  })
    .select('_id')
    .lean();

  if (!property) {
    return 'propertyId must reference an existing property in this organization';
  }

  if (!payload.taxYearLabel) {
    return 'taxYearLabel is required';
  }

  const duplicateQuery = {
    realmId,
    propertyId: payload.propertyId,
    taxYearLabel: payload.taxYearLabel
  };

  if (existingStatementId) {
    duplicateQuery._id = { $ne: existingStatementId };
  }

  const existingStatements = await Collections.PropertyTaxStatement.find(
    duplicateQuery
  )
    .select('_id accountNumber')
    .lean();

  const normalizedIncomingAccount = normalizeText(
    payload.accountNumber || ''
  ).toLowerCase();

  const duplicateStatement = existingStatements.find((statement) => {
    const normalizedExistingAccount = normalizeText(
      statement.accountNumber || ''
    ).toLowerCase();

    return normalizedExistingAccount === normalizedIncomingAccount;
  });

  if (duplicateStatement) {
    if (!normalizedIncomingAccount) {
      return 'A tax statement for this property and tax year already exists. Add an account number to save multiple statements for the same year.';
    }

    return 'A tax statement for this property, tax year, and account number already exists';
  }

  if (payload.landLeasedPercentage < 0 || payload.landLeasedPercentage > 100) {
    return 'landLeasedPercentage must be between 0 and 100';
  }

  const buildingSplitError = await validateSplitItems(
    realmId,
    payload.propertyId,
    payload.buildingUnitSplits,
    'Building'
  );

  if (buildingSplitError) {
    return buildingSplitError;
  }

  const landSplitError = await validateSplitItems(
    realmId,
    payload.propertyId,
    payload.landUnitSplits,
    'Land'
  );

  if (landSplitError) {
    return landSplitError;
  }

  if (payload.attachmentIds.length) {
    const attachmentCount = await Collections.Attachment.countDocuments({
      _id: { $in: payload.attachmentIds },
      realmId,
      targetType: 'property_tax_statement',
      category: 'other'
    });

    if (attachmentCount !== payload.attachmentIds.length) {
      return 'All attachmentIds must reference uploaded property tax statement files';
    }
  }

  if (payload.paymentConfirmations.length) {
    const confirmationAttachmentIds = payload.paymentConfirmations.flatMap(
      (item) => item.attachmentIds || []
    );

    if (confirmationAttachmentIds.length) {
      const attachmentCount = await Collections.Attachment.countDocuments({
        _id: { $in: confirmationAttachmentIds },
        realmId,
        targetType: 'property_tax_statement',
        category: 'tax_payment_confirmation'
      });

      if (attachmentCount !== confirmationAttachmentIds.length) {
        return 'All payment confirmation attachmentIds must reference uploaded payment confirmation files';
      }
    }
  }

  return null;
}

function normalizePaymentConfirmationPayload(payload = {}, user = {}) {
  return {
    paidOn: normalizeDate(payload.paidOn),
    paidAmount: normalizeNumber(payload.paidAmount),
    feeAmount: normalizeNumber(payload.feeAmount),
    paymentMethod: normalizeText(payload.paymentMethod),
    confirmationNumber: normalizeText(payload.confirmationNumber),
    notes: normalizeText(payload.notes),
    attachmentIds: Array.isArray(payload.attachmentIds)
      ? payload.attachmentIds.map((id) => String(id))
      : [],
    createdAt: new Date(),
    createdBy: normalizeText(
      user?.email ||
        [user?.firstname, user?.lastname].filter(Boolean).join(' ') ||
        user?._id ||
        ''
    )
  };
}

async function validatePaymentConfirmation(realmId, statementId, payload) {
  if (!payload.paidOn) {
    return 'paidOn is required';
  }

  if (!Number.isFinite(payload.paidAmount) || payload.paidAmount <= 0) {
    return 'paidAmount must be a positive number';
  }

  if (!Number.isFinite(payload.feeAmount) || payload.feeAmount < 0) {
    return 'feeAmount must be a non-negative number';
  }

  if (payload.attachmentIds.length) {
    const attachmentCount = await Collections.Attachment.countDocuments({
      _id: { $in: payload.attachmentIds },
      realmId,
      targetType: 'property_tax_statement',
      targetId: statementId,
      category: 'tax_payment_confirmation'
    });

    if (attachmentCount !== payload.attachmentIds.length) {
      return 'All attachmentIds must reference uploaded payment confirmation files for this statement';
    }
  }

  return null;
}

export async function all(req, res) {
  const query = { realmId: req.realm._id };
  if (req.query.propertyId) {
    query.propertyId = String(req.query.propertyId);
  }

  const statements = await Collections.PropertyTaxStatement.find(query)
    .sort({ taxYearLabel: -1, createdAt: -1 })
    .lean();

  return res.json(statements);
}

export async function one(req, res) {
  const statement = await Collections.PropertyTaxStatement.findOne({
    _id: req.params.id,
    realmId: req.realm._id
  }).lean();

  if (!statement) {
    return res
      .status(404)
      .json({ message: 'Property tax statement not found' });
  }

  return res.json(statement);
}

export async function add(req, res) {
  const payload = normalizePayload(req.body || {});
  const validationError = await validatePayload(req.realm._id, payload);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const statement = new Collections.PropertyTaxStatement({
    realmId: req.realm._id,
    ...payload
  });

  await statement.save();

  return res.status(201).json(statement.toObject());
}

export async function update(req, res) {
  const payload = normalizePayload(req.body || {});
  const validationError = await validatePayload(
    req.realm._id,
    payload,
    String(req.params.id)
  );

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const statement = await Collections.PropertyTaxStatement.findOneAndUpdate(
    {
      _id: req.params.id,
      realmId: req.realm._id
    },
    payload,
    { new: true }
  ).lean();

  if (!statement) {
    return res
      .status(404)
      .json({ message: 'Property tax statement not found' });
  }

  return res.json(statement);
}

export async function remove(req, res) {
  const result = await Collections.PropertyTaxStatement.deleteOne({
    _id: req.params.id,
    realmId: req.realm._id
  });

  if (!result.deletedCount) {
    return res
      .status(404)
      .json({ message: 'Property tax statement not found' });
  }

  return res.sendStatus(204);
}

export async function parseStatementAttachment(req, res) {
  const statement = await Collections.PropertyTaxStatement.findOne({
    _id: req.params.id,
    realmId: req.realm._id
  }).lean();

  if (!statement) {
    return res
      .status(404)
      .json({ message: 'Property tax statement not found' });
  }

  const parsedAttachment = await loadAttachmentForParsing(
    req.realm._id,
    String(statement._id),
    req.params.attachmentId
  );

  if (!parsedAttachment) {
    return res.status(404).json({
      message: 'Attachment not found or file missing on server'
    });
  }

  const extracted = parseTaxStatementFields(
    parsedAttachment.text,
    parsedAttachment.attachment.filename
  );

  const hasAnyExtractedValue = Object.values(extracted).some(
    (value) => value !== null && value !== ''
  );

  return res.json({
    extracted,
    warnings: hasAnyExtractedValue
      ? []
      : [
          'No tax fields could be extracted. For image-only PDFs/photos, OCR is required and is not enabled in this environment.'
        ]
  });
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
  const extracted = parseTaxStatementFields(text, req.file.originalname || '');
  const hasAnyExtractedValue = Object.values(extracted).some(
    (value) => value !== null && value !== ''
  );

  return res.json({
    extracted,
    warnings: hasAnyExtractedValue
      ? []
      : [
          'No tax fields could be extracted. For image-only PDFs/photos, OCR is required and is not enabled in this environment.'
        ]
  });
}

export async function reportCsv(req, res) {
  const query = { realmId: req.realm._id };
  if (req.query.propertyId) {
    query.propertyId = String(req.query.propertyId);
  }

  if (req.query.taxYearLabel) {
    query.taxYearLabel = String(req.query.taxYearLabel);
  }

  const statements = await Collections.PropertyTaxStatement.find(query)
    .sort({ propertyId: 1, taxYearLabel: -1 })
    .lean();

  const properties = await Collections.Property.find(
    { realmId: req.realm._id },
    { _id: 1, name: 1 }
  ).lean();
  const propertyById = new Map(
    properties.map((property) => [String(property._id), property.name || ''])
  );

  let rows = statements.map((statement) => {
    const row = buildTaxReportRow(statement);
    return {
      propertyName: propertyById.get(row.propertyId) || 'Unknown property',
      taxYearLabel: row.taxYearLabel,
      status: row.status,
      totalDue: row.totalDue,
      totalPaid: row.totalPaid,
      totalFees: row.totalFees,
      balance: row.balance,
      overpaidAmount: row.overpaidAmount,
      confirmationsCount: row.confirmationsCount,
      lastPaymentDate: row.lastPaymentDate
    };
  });

  if (req.query.status) {
    const normalizedStatus = String(req.query.status).toLowerCase();
    rows = rows.filter((row) => row.status === normalizedStatus);
  }

  const fields = [
    { label: 'Property', value: 'propertyName' },
    { label: 'Tax year', value: 'taxYearLabel' },
    { label: 'Status', value: 'status' },
    { label: 'Total due', value: 'totalDue' },
    { label: 'Total paid', value: 'totalPaid' },
    { label: 'Total fees', value: 'totalFees' },
    { label: 'Balance', value: 'balance' },
    { label: 'Overpaid amount', value: 'overpaidAmount' },
    { label: 'Confirmations', value: 'confirmationsCount' },
    { label: 'Last payment date', value: 'lastPaymentDate' }
  ];

  const json2csv = new Parser({ fields, delimiter: ';', withBOM: true });
  const csv = json2csv.parse(rows);

  res.header('Content-Type', 'text/csv');
  res.header(
    'Content-Disposition',
    `attachment; filename="property-tax-report-${new Date().toISOString().slice(0, 10)}.csv"`
  );
  return res.send(csv);
}

export async function addPaymentConfirmation(req, res) {
  const statement = await Collections.PropertyTaxStatement.findOne({
    _id: req.params.id,
    realmId: req.realm._id
  });

  if (!statement) {
    return res
      .status(404)
      .json({ message: 'Property tax statement not found' });
  }

  const payload = normalizePaymentConfirmationPayload(req.body || {}, req.user);
  const validationError = await validatePaymentConfirmation(
    req.realm._id,
    String(statement._id),
    payload
  );

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  statement.paymentConfirmations = [
    ...(statement.paymentConfirmations || []),
    payload
  ];
  await statement.save();

  return res.status(201).json(statement.toObject());
}
