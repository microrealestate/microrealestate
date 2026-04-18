import { Collections } from '@microrealestate/common';
import { Parser } from 'json2csv';

const UTILITY_TYPE_ORDER = ['power', 'gas', 'water', 'sewer', 'trash', 'internet', 'other'];

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundCurrency(value) {
  return Number((toNumber(value) + Number.EPSILON).toFixed(2));
}

function normalizeId(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'object' && value._id) {
    return String(value._id);
  }

  return String(value);
}

function normalizePropertyParentId(property) {
  return normalizeId(property?.parentPropertyId);
}

function getPropertyLabel(property, propertyById) {
  if (!property) {
    return 'Unknown property';
  }

  const parentPropertyId = normalizePropertyParentId(property);
  if (!parentPropertyId) {
    return String(property.name || 'Unnamed property');
  }

  const parentProperty = propertyById[parentPropertyId];
  if (!parentProperty) {
    return String(property.name || 'Unnamed property');
  }

  return `${parentProperty.name} / ${property.name}`;
}

function buildUtilityTotals() {
  return UTILITY_TYPE_ORDER.reduce((accumulator, type) => {
    accumulator[type] = 0;
    return accumulator;
  }, {});
}

function addUtilityAmount(target, type, amount) {
  const normalizedType = UTILITY_TYPE_ORDER.includes(type) ? type : 'other';
  target[normalizedType] = roundCurrency(toNumber(target[normalizedType]) + amount);
}

function flattenUtilityTotals(totals) {
  return UTILITY_TYPE_ORDER.reduce((accumulator, type) => {
    accumulator[`${type}Total`] = roundCurrency(totals[type]);
    return accumulator;
  }, {});
}

function parseBillingMonthToDate(value) {
  const month = String(value || '').trim();
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) {
    return null;
  }

  return new Date(Date.UTC(year, monthIndex, 1));
}

function parseDateParam(value, boundary) {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    if (boundary === 'end') {
      return new Date(`${normalized}T23:59:59.999Z`);
    }
    return new Date(`${normalized}T00:00:00.000Z`);
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function isWithinDateRange(dateValue, startDate, endDate) {
  if (!dateValue) {
    return !startDate && !endDate;
  }

  const timestamp = dateValue.getTime();
  if (Number.isNaN(timestamp)) {
    return !startDate && !endDate;
  }

  if (startDate && timestamp < startDate.getTime()) {
    return false;
  }

  if (endDate && timestamp > endDate.getTime()) {
    return false;
  }

  return true;
}

function resolveTopParentId(property, propertyById) {
  if (!property) {
    return '';
  }

  let current = property;
  const visited = new Set();

  while (current) {
    const currentId = normalizeId(current._id);
    const parentId = normalizePropertyParentId(current);

    if (!parentId) {
      return currentId;
    }

    if (visited.has(parentId)) {
      return currentId;
    }
    visited.add(parentId);

    current = propertyById[parentId];
    if (!current) {
      return currentId;
    }
  }

  return normalizeId(property._id);
}

function resolveScopedPropertyIds(allProperties, propertyById, selectedPropertyId) {
  if (!selectedPropertyId) {
    return new Set(allProperties.map((property) => normalizeId(property._id)));
  }

  const selected = propertyById[selectedPropertyId];
  if (!selected) {
    return new Set();
  }

  const selectedTopParentId = resolveTopParentId(selected, propertyById);
  const scopedIds = new Set();

  allProperties.forEach((property) => {
    const propertyId = normalizeId(property._id);
    const propertyTopParentId = resolveTopParentId(property, propertyById);
    if (propertyTopParentId === selectedTopParentId) {
      scopedIds.add(propertyId);
    }
  });

  return scopedIds;
}

function getTaxStatementDate(statement) {
  const periodEnd = statement?.periodEnd ? new Date(statement.periodEnd) : null;
  if (periodEnd && !Number.isNaN(periodEnd.getTime())) {
    return periodEnd;
  }

  const periodStart = statement?.periodStart
    ? new Date(statement.periodStart)
    : null;
  if (periodStart && !Number.isNaN(periodStart.getTime())) {
    return periodStart;
  }

  const createdAt = statement?.createdAt ? new Date(statement.createdAt) : null;
  if (createdAt && !Number.isNaN(createdAt.getTime())) {
    return createdAt;
  }

  return null;
}

function summarizeTaxStatement(statement) {
  const confirmations = Array.isArray(statement?.paymentConfirmations)
    ? statement.paymentConfirmations
    : [];
  const due = roundCurrency(statement?.totalAfterDiscount || 0);
  const paid = roundCurrency(
    confirmations.reduce(
      (sum, confirmation) => sum + toNumber(confirmation?.paidAmount),
      0
    )
  );
  const signedBalance = roundCurrency(due - paid);
  const balance = Math.max(0, signedBalance);

  return {
    due,
    paid,
    balance,
    signedBalance,
    estimatedNextYearTotal: roundCurrency(statement?.estimatedNextYearTotal || 0)
  };
}

function getTaxSplitShares(statement) {
  const totalDue = toNumber(statement?.totalAfterDiscount);
  if (totalDue <= 0) {
    return {};
  }

  const landLeasedPercentage = Math.max(
    0,
    Math.min(100, toNumber(statement?.landLeasedPercentage, 100))
  );
  const buildingLeasedPercentage = 100 - landLeasedPercentage;
  const landAmount = (totalDue * landLeasedPercentage) / 100;
  const buildingAmount = (totalDue * buildingLeasedPercentage) / 100;

  const sharesByUnit = {};

  const appendShares = (items, bucketAmount) => {
    if (!Array.isArray(items)) {
      return;
    }

    items.forEach((item) => {
      const unitId = normalizeId(item?.subPropertyId);
      if (!unitId) {
        return;
      }

      const percentage = toNumber(item?.percentage);
      if (percentage <= 0) {
        return;
      }

      const amount = (bucketAmount * percentage) / 100;
      sharesByUnit[unitId] = roundCurrency(toNumber(sharesByUnit[unitId]) + amount);
    });
  };

  appendShares(statement?.buildingUnitSplits, buildingAmount);
  appendShares(statement?.landUnitSplits, landAmount);

  return sharesByUnit;
}

function buildAnomalyRows(utilities, propertyById, thresholdPercent, lookbackMonths, minBillAmount) {
  const grouped = new Map();

  utilities.forEach((utility) => {
    const propertyId = normalizeId(utility?.propertyId);
    const type = String(utility?.type || '').trim().toLowerCase();
    if (!propertyId || !type) {
      return;
    }

    const key = `${propertyId}::${type}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(utility);
  });

  const anomalies = [];

  grouped.forEach((items, key) => {
    const [propertyId, type] = key.split('::');
    const ordered = items
      .slice()
      .sort((left, right) =>
        String(left?.billingMonth || '').localeCompare(String(right?.billingMonth || ''))
      );

    for (let index = lookbackMonths; index < ordered.length; index += 1) {
      const current = ordered[index];
      const currentAmount = toNumber(current?.amount);
      if (currentAmount < minBillAmount) {
        continue;
      }

      const baselineWindow = ordered.slice(index - lookbackMonths, index);
      const baselineAverage =
        baselineWindow.reduce(
          (sum, row) => sum + toNumber(row?.amount),
          0
        ) / lookbackMonths;

      if (!Number.isFinite(baselineAverage) || baselineAverage <= 0) {
        continue;
      }

      const percentAbove = ((currentAmount - baselineAverage) / baselineAverage) * 100;
      if (percentAbove < thresholdPercent) {
        continue;
      }

      const property = propertyById[propertyId];
      anomalies.push({
        utilityId: normalizeId(current?._id),
        propertyId,
        propertyLabel: getPropertyLabel(property, propertyById),
        type,
        billingMonth: String(current?.billingMonth || ''),
        amount: roundCurrency(currentAmount),
        baselineAmount: roundCurrency(baselineAverage),
        deltaAmount: roundCurrency(currentAmount - baselineAverage),
        percentAbove: roundCurrency(percentAbove),
        severity: percentAbove >= thresholdPercent * 2 ? 'critical' : 'warning'
      });
    }
  });

  return anomalies.sort((left, right) => right.percentAbove - left.percentAbove);
}

function buildEmailTemplate({
  propertyLabel,
  squareFeet,
  askingRate,
  leaseType,
  monthlyTaxEstimate,
  monthlyInsuranceEstimate,
  availabilitySentence
}) {
  return `${propertyLabel}:\n\nThe space is ${squareFeet.toFixed(
    0
  )} square feet, and we are asking $${askingRate.toFixed(
    2
  )} per square foot per year under a ${leaseType} lease. Based on last year's figures, property taxes were approximately $${monthlyTaxEstimate.toFixed(
    2
  )} per month, and insurance is estimated at around $${monthlyInsuranceEstimate.toFixed(
    2
  )} per month.\n\n${availabilitySentence}\n\nPlease let me know if you have any additional questions.\nThank you`;
}

function getSpaceMarketingPayload({ property, parentProperty, propertyById, latestTaxStatement, latestInsuranceUtility }) {
  const squareMeters = toNumber(property?.surface);
  const squareFeet = squareMeters * 10.7639;

  const highRate = toNumber(
    property?.rentHighSqftYear,
    toNumber(parentProperty?.rentHighSqftYear)
  );
  const monthlyTaxEstimate = roundCurrency(toNumber(latestTaxStatement?.totalAfterDiscount) / 12);
  const monthlyInsuranceEstimate = roundCurrency(
    toNumber(latestInsuranceUtility?.amount)
  );

  const propertyLabel = getPropertyLabel(property, propertyById);
  const leaseType = 'NNN';
  const availabilitySentence =
    "I'm available to show the space in the evenings or on weekends.";

  const mediaWarnings = [];
  if (!property?.coverPhotoAttachmentId && !parentProperty?.coverPhotoAttachmentId) {
    mediaWarnings.push('Missing main picture');
  }
  if (!property?.floorPlanAttachmentId && !parentProperty?.floorPlanAttachmentId) {
    mediaWarnings.push('Missing floor plan');
  }

  return {
    propertyId: normalizeId(property?._id),
    propertyLabel,
    parentPropertyId: normalizeId(parentProperty?._id),
    spaceSquareMeters: roundCurrency(squareMeters),
    spaceSquareFeet: roundCurrency(squareFeet),
    askingRentPerSqftYearHigh: roundCurrency(highRate),
    leaseType,
    monthlyTaxEstimate,
    monthlyInsuranceEstimate,
    availabilitySentence,
    coverPhotoAttachmentId:
      property?.coverPhotoAttachmentId || parentProperty?.coverPhotoAttachmentId || '',
    floorPlanAttachmentId:
      property?.floorPlanAttachmentId || parentProperty?.floorPlanAttachmentId || '',
    mediaWarnings,
    emailTemplate: buildEmailTemplate({
      propertyLabel,
      squareFeet,
      askingRate: highRate,
      leaseType,
      monthlyTaxEstimate,
      monthlyInsuranceEstimate,
      availabilitySentence
    })
  };
}

export async function propertyCosts(req, res) {
  const realmId = String(req.realm._id);
  const selectedPropertyId = normalizeId(req.query.propertyId);
  const includePending =
    String(req.query.includePending || 'false').toLowerCase() === 'true';
  const startDate = parseDateParam(req.query.startDate, 'start');
  const endDate = parseDateParam(req.query.endDate, 'end');

  const [properties, utilities] = await Promise.all([
    Collections.Property.find({ realmId }).lean(),
    Collections.Utility.find({ realmId }).lean()
  ]);

  const propertyById = properties.reduce((accumulator, property) => {
    accumulator[normalizeId(property._id)] = property;
    return accumulator;
  }, {});

  const scopedPropertyIds = resolveScopedPropertyIds(
    properties,
    propertyById,
    selectedPropertyId
  );

  const parentRowsMap = {};
  properties.forEach((property) => {
    const propertyId = normalizeId(property._id);
    if (!scopedPropertyIds.has(propertyId)) {
      return;
    }

    const topParentId = resolveTopParentId(property, propertyById);
    const topParent = propertyById[topParentId] || property;

    if (!parentRowsMap[topParentId]) {
      parentRowsMap[topParentId] = {
        parentPropertyId: topParentId,
        parentPropertyName: String(topParent?.name || 'Unnamed property'),
        utilitiesTotal: 0,
        utilityTotalsByType: buildUtilityTotals(),
        childRows: {}
      };
    }

    if (normalizePropertyParentId(property)) {
      parentRowsMap[topParentId].childRows[propertyId] = {
        propertyId,
        propertyName: String(property?.name || 'Unnamed property'),
        utilitiesTotal: 0,
        utilityTotalsByType: buildUtilityTotals()
      };
    }
  });

  const scopedUtilities = utilities.filter((utility) => {
    const propertyId = normalizeId(utility?.propertyId);
    if (!scopedPropertyIds.has(propertyId)) {
      return false;
    }

    if (!includePending && String(utility?.status || 'confirmed') !== 'confirmed') {
      return false;
    }

    const utilityDate = parseBillingMonthToDate(utility?.billingMonth);
    return isWithinDateRange(utilityDate, startDate, endDate);
  });

  scopedUtilities.forEach((utility) => {
    const propertyId = normalizeId(utility?.propertyId);
    const property = propertyById[propertyId];
    if (!property) {
      return;
    }

    const amount = roundCurrency(utility?.amount || 0);
    const category = String(utility?.type || 'other').trim().toLowerCase() || 'other';
    const topParentId = resolveTopParentId(property, propertyById);
    const parentRow = parentRowsMap[topParentId];
    if (!parentRow) {
      return;
    }

    parentRow.utilitiesTotal = roundCurrency(parentRow.utilitiesTotal + amount);
    addUtilityAmount(parentRow.utilityTotalsByType, category, amount);

    const parentPropertyId = normalizePropertyParentId(property);
    if (parentPropertyId && parentRow.childRows[propertyId]) {
      parentRow.childRows[propertyId].utilitiesTotal = roundCurrency(
        parentRow.childRows[propertyId].utilitiesTotal + amount
      );
      addUtilityAmount(
        parentRow.childRows[propertyId].utilityTotalsByType,
        category,
        amount
      );
    }
  });

  const parentRows = Object.values(parentRowsMap)
    .map((row) => ({
      ...row,
      ...flattenUtilityTotals(row.utilityTotalsByType),
      combinedCost: roundCurrency(row.utilitiesTotal),
      childRows: Object.values(row.childRows)
        .map((child) => ({
          ...child,
          ...flattenUtilityTotals(child.utilityTotalsByType),
          combinedCost: roundCurrency(child.utilitiesTotal)
        }))
        .sort((left, right) => left.propertyName.localeCompare(right.propertyName))
    }))
    .sort((left, right) => left.parentPropertyName.localeCompare(right.parentPropertyName));

  return res.json({
    filters: {
      startDate: startDate ? startDate.toISOString().slice(0, 10) : null,
      endDate: endDate ? endDate.toISOString().slice(0, 10) : null,
      propertyId: selectedPropertyId || null,
      includePending
    },
    sections: {
      propertyCostBreakdown: parentRows,
      utilityTypes: UTILITY_TYPE_ORDER
    }
  });
}

export async function propertyCostsCsv(req, res) {
  const fakeRes = {
    jsonPayload: null,
    json(payload) {
      this.jsonPayload = payload;
      return payload;
    }
  };

  await propertyCosts(req, fakeRes);

  const rows = [];
  const breakdown = fakeRes?.jsonPayload?.sections?.propertyCostBreakdown || [];

  breakdown.forEach((parentRow) => {
    rows.push({
      scope: 'parent',
      parentProperty: parentRow.parentPropertyName,
      property: parentRow.parentPropertyName,
      utilitiesTotal: parentRow.utilitiesTotal,
      ...UTILITY_TYPE_ORDER.reduce((accumulator, type) => {
        accumulator[type] = parentRow[`${type}Total`] || 0;
        return accumulator;
      }, {}),
      combinedCost: parentRow.combinedCost
    });

    (parentRow.childRows || []).forEach((childRow) => {
      rows.push({
        scope: 'child',
        parentProperty: parentRow.parentPropertyName,
        property: childRow.propertyName,
        utilitiesTotal: childRow.utilitiesTotal,
        ...UTILITY_TYPE_ORDER.reduce((accumulator, type) => {
          accumulator[type] = childRow[`${type}Total`] || 0;
          return accumulator;
        }, {}),
        combinedCost: childRow.combinedCost
      });
    });
  });

  const fields = [
    { label: 'Scope', value: 'scope' },
    { label: 'Parent Property', value: 'parentProperty' },
    { label: 'Property', value: 'property' },
    { label: 'Utilities Total', value: 'utilitiesTotal' },
    { label: 'Power', value: 'power' },
    { label: 'Gas', value: 'gas' },
    { label: 'Water', value: 'water' },
    { label: 'Sewer', value: 'sewer' },
    { label: 'Trash', value: 'trash' },
    { label: 'Internet', value: 'internet' },
    { label: 'Other', value: 'other' },
    { label: 'Combined Cost', value: 'combinedCost' }
  ];

  const parser = new Parser({ fields, delimiter: ';', withBOM: true });
  const csv = parser.parse(rows);

  res.header('Content-Type', 'text/csv');
  return res.send(csv);
}

function normalizeAccountNumber(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function normalizeDateValue(value) {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().slice(0, 10);
}

function buildUtilityAccountKey(type, accountNumber) {
  return `${String(type || '').trim().toLowerCase()}::${normalizeAccountNumber(
    accountNumber
  )}`;
}

function getUtilityAccountLabel(utilityAccount) {
  if (!utilityAccount) {
    return '';
  }

  return [utilityAccount.provider, utilityAccount.accountNumber]
    .filter(Boolean)
    .join(' / ');
}

function buildUtilityReportRows({
  properties,
  utilities,
  utilityAccounts,
  selectedPropertyId,
  includePending,
  startDate,
  endDate
}) {
  const propertyById = properties.reduce((accumulator, property) => {
    accumulator[normalizeId(property._id)] = property;
    return accumulator;
  }, {});

  const utilityAccountByKey = utilityAccounts.reduce((accumulator, utilityAccount) => {
    accumulator[buildUtilityAccountKey(utilityAccount.type, utilityAccount.accountNumber)] = utilityAccount;
    return accumulator;
  }, {});

  const scopedPropertyIds = resolveScopedPropertyIds(
    properties,
    propertyById,
    selectedPropertyId
  );

  return utilities
    .filter((utility) => {
      const propertyId = normalizeId(utility?.propertyId);
      if (!scopedPropertyIds.has(propertyId)) {
        return false;
      }

      if (!includePending && String(utility?.status || 'confirmed') !== 'confirmed') {
        return false;
      }

      const utilityDate = parseBillingMonthToDate(utility?.billingMonth);
      return isWithinDateRange(utilityDate, startDate, endDate);
    })
    .map((utility) => {
      const propertyId = normalizeId(utility?.propertyId);
      const property = propertyById[propertyId];
      if (!property) {
        return null;
      }

      const parentPropertyId = normalizePropertyParentId(property);
      const parentProperty = parentPropertyId ? propertyById[parentPropertyId] : null;
      const matchedAccount = utilityAccountByKey[
        buildUtilityAccountKey(utility?.type, utility?.accountNumber)
      ];
      const accountAllocationLabels = Array.isArray(matchedAccount?.allocations)
        ? matchedAccount.allocations
            .map((allocation) => propertyById[normalizeId(allocation?.propertyId)])
            .filter(Boolean)
            .map((allocationProperty) => getPropertyLabel(allocationProperty, propertyById))
        : [];

      return {
        id: normalizeId(utility?._id),
        propertyId,
        propertyLabel: getPropertyLabel(property, propertyById),
        parentPropertyId,
        parentPropertyLabel: parentProperty
          ? String(parentProperty.name || 'Unnamed property')
          : '',
        childPropertyLabel: String(property.name || 'Unnamed property'),
        accountKey: buildUtilityAccountKey(utility?.type, utility?.accountNumber),
        accountNumber: String(utility?.accountNumber || matchedAccount?.accountNumber || ''),
        accountLabel: getUtilityAccountLabel(matchedAccount) || String(utility?.accountNumber || ''),
        provider: String(utility?.provider || matchedAccount?.provider || ''),
        accountAllocationLabels,
        billingMonth: String(utility?.billingMonth || ''),
        amount: roundCurrency(utility?.amount || 0),
        dueDate: normalizeDateValue(utility?.dueDate),
        paidDate: normalizeDateValue(utility?.paidDate),
        type: String(utility?.type || 'other').trim().toLowerCase() || 'other',
        status: String(utility?.status || 'confirmed').trim().toLowerCase() || 'confirmed',
        source: String(utility?.source || 'manual').trim().toLowerCase() || 'manual',
        notes: String(utility?.notes || '').trim(),
        lastUpdatedBy: String(utility?.lastUpdatedBy || '').trim(),
        createdAt: normalizeDateValue(utility?.createdAt),
        updatedAt: normalizeDateValue(utility?.updatedAt)
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      const monthComparison = String(right.billingMonth || '').localeCompare(
        String(left.billingMonth || '')
      );
      if (monthComparison !== 0) {
        return monthComparison;
      }

      const propertyComparison = String(left.propertyLabel || '').localeCompare(
        String(right.propertyLabel || '')
      );
      if (propertyComparison !== 0) {
        return propertyComparison;
      }

      return String(left.accountLabel || '').localeCompare(String(right.accountLabel || ''));
    });
}

function buildUtilityReportSummary(rows) {
  return rows.reduce(
    (accumulator, row) => {
      accumulator.totalAmount = roundCurrency(accumulator.totalAmount + Number(row.amount || 0));
      accumulator.byStatus[row.status] = roundCurrency(
        Number(accumulator.byStatus[row.status] || 0) + Number(row.amount || 0)
      );
      accumulator.byType[row.type] = roundCurrency(
        Number(accumulator.byType[row.type] || 0) + Number(row.amount || 0)
      );
      return accumulator;
    },
    {
      totalAmount: 0,
      byStatus: { confirmed: 0, pending: 0 },
      byType: {}
    }
  );
}

export async function utilityLedger(req, res) {
  const realmId = String(req.realm._id);
  const selectedPropertyId = normalizeId(req.query.propertyId);
  const includePending =
    String(req.query.includePending || 'true').toLowerCase() !== 'false';
  const startDate = parseDateParam(req.query.startDate, 'start');
  const endDate = parseDateParam(req.query.endDate, 'end');

  const [properties, utilities, utilityAccounts] = await Promise.all([
    Collections.Property.find({ realmId }).lean(),
    Collections.Utility.find({ realmId }).lean(),
    Collections.UtilityAccount.find({ realmId }).lean()
  ]);

  const rows = buildUtilityReportRows({
    properties,
    utilities,
    utilityAccounts,
    selectedPropertyId,
    includePending,
    startDate,
    endDate
  });
  const summary = buildUtilityReportSummary(rows);
  const billingMonths = [...new Set(rows.map((row) => row.billingMonth).filter(Boolean))].sort(
    (left, right) => right.localeCompare(left)
  );

  return res.json({
    filters: {
      startDate: startDate ? startDate.toISOString().slice(0, 10) : null,
      endDate: endDate ? endDate.toISOString().slice(0, 10) : null,
      propertyId: selectedPropertyId || null,
      includePending
    },
    rows,
    summary,
    billingMonths,
    utilityTypes: UTILITY_TYPE_ORDER
  });
}

export async function utilityLedgerCsv(req, res) {
  const fakeRes = {
    jsonPayload: null,
    json(payload) {
      this.jsonPayload = payload;
      return payload;
    }
  };

  await utilityLedger(req, fakeRes);

  const rows = fakeRes?.jsonPayload?.rows || [];
  const fields = [
    { label: 'Billing Month', value: 'billingMonth' },
    { label: 'Property', value: 'propertyLabel' },
    { label: 'Parent Property', value: 'parentPropertyLabel' },
    { label: 'Account Number', value: 'accountNumber' },
    { label: 'Account', value: 'accountLabel' },
    { label: 'Account Allocations', value: (row) => (row.accountAllocationLabels || []).join(' | ') },
    { label: 'Type', value: 'type' },
    { label: 'Status', value: 'status' },
    { label: 'Source', value: 'source' },
    { label: 'Amount', value: 'amount' },
    { label: 'Due Date', value: 'dueDate' },
    { label: 'Paid Date', value: 'paidDate' },
    { label: 'Notes', value: 'notes' },
    { label: 'Last Updated By', value: 'lastUpdatedBy' },
    { label: 'Created At', value: 'createdAt' },
    { label: 'Updated At', value: 'updatedAt' }
  ];

  const parser = new Parser({ fields, delimiter: ';', withBOM: true });
  const csv = parser.parse(rows);

  res.header('Content-Type', 'text/csv');
  return res.send(csv);
}

export async function spaceMarketingSummary(req, res) {
  const realmId = String(req.realm._id);
  const selectedPropertyId = normalizeId(req.query.propertyId);

  if (!selectedPropertyId) {
    return res.status(400).json({
      message: 'propertyId is required'
    });
  }

  const [properties, propertyTaxStatements, utilities] = await Promise.all([
    Collections.Property.find({ realmId }).lean(),
    Collections.PropertyTaxStatement.find({ realmId }).lean(),
    Collections.Utility.find({ realmId, type: 'insurance' }).lean()
  ]);

  const propertyById = properties.reduce((accumulator, property) => {
    accumulator[normalizeId(property._id)] = property;
    return accumulator;
  }, {});

  const property = propertyById[selectedPropertyId];
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }

  const parentPropertyId = normalizePropertyParentId(property);
  const parentProperty = parentPropertyId
    ? propertyById[parentPropertyId] || null
    : property;
  const taxTargetId = normalizeId(parentProperty?._id || property._id);

  const latestTaxStatement = propertyTaxStatements
    .filter((statement) => normalizeId(statement?.propertyId) === taxTargetId)
    .sort((left, right) => {
      const leftDate = getTaxStatementDate(left);
      const rightDate = getTaxStatementDate(right);
      return toNumber(rightDate?.getTime()) - toNumber(leftDate?.getTime());
    })[0];

  const latestInsuranceUtility = utilities
    .filter((utility) => {
      const utilityPropertyId = normalizeId(utility?.propertyId);
      return utilityPropertyId === selectedPropertyId || utilityPropertyId === taxTargetId;
    })
    .sort((left, right) =>
      String(right?.billingMonth || '').localeCompare(String(left?.billingMonth || ''))
    )[0];

  const payload = getSpaceMarketingPayload({
    property,
    parentProperty,
    propertyById,
    latestTaxStatement,
    latestInsuranceUtility
  });

  return res.json(payload);
}