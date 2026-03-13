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

function parseTaxStatementFields(text, filename = '') {
  const mergedText = `${String(filename)}\n${String(text || '')}`;

  const taxYearLabel =
    parseStringFromText(mergedText, [/\b(20\d{2}\s*-\s*20\d{2})\b/i]) ||
    parseStringFromText(mergedText, [/\b(20\d{2})\b/]);

  return {
    taxYearLabel,
    accountNumber: parseStringFromText(mergedText, [
      /account\s*(?:number|no\.?|#)?\s*[:-]?\s*([a-z0-9-]+)/i
    ]),
    mapNumber: parseStringFromText(mergedText, [
      /map\s*(?:number|no\.?|#)?\s*[:-]?\s*([a-z0-9-]+)/i
    ]),
    taxBeforeDiscount: parseNumberFromText(mergedText, [
      /tax\s*before\s*discount\s*[:$]?\s*([\d,.]+)/i,
      /total\s*tax(?:es)?\s*[:$]?\s*([\d,.]+)/i
    ]),
    delinquentTaxes: parseNumberFromText(mergedText, [
      /delinquent\s*tax(?:es)?\s*[:$]?\s*([\d,.]+)/i
    ]),
    totalAfterDiscount: parseNumberFromText(mergedText, [
      /total\s*after\s*discount\s*[:$]?\s*([\d,.]+)/i,
      /amount\s*due\s*[:$]?\s*([\d,.]+)/i
    ])
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

async function validatePayload(realmId, payload) {
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
  const validationError = await validatePayload(req.realm._id, payload);

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
