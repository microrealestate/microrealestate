import { Collections } from '@microrealestate/common';
import { Parser } from 'json2csv';

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

  const thresholdPercent = Math.max(0, toNumber(req.query.anomalyThreshold, 40));
  const lookbackMonths = Math.max(2, toNumber(req.query.anomalyLookbackMonths, 3));
  const minBillAmount = Math.max(0, toNumber(req.query.anomalyMinBillAmount, 0));

  const [properties, utilities, propertyTaxStatements] = await Promise.all([
    Collections.Property.find({ realmId }).lean(),
    Collections.Utility.find({ realmId }).lean(),
    Collections.PropertyTaxStatement.find({ realmId }).lean()
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
        taxDue: 0,
        taxPaid: 0,
        taxBalance: 0,
        combinedCost: 0,
        childRows: {}
      };
    }

    if (normalizePropertyParentId(property)) {
      parentRowsMap[topParentId].childRows[propertyId] = {
        propertyId,
        propertyName: String(property?.name || 'Unnamed property'),
        utilitiesTotal: 0,
        taxDue: 0,
        taxPaid: 0,
        taxBalance: 0,
        combinedCost: 0
      };
    }
  });

  const categoryTotalsByMonth = {};
  const delinquentUtilities = [];

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

    const topParentId = resolveTopParentId(property, propertyById);
    const parentRow = parentRowsMap[topParentId];
    if (!parentRow) {
      return;
    }

    const amount = roundCurrency(utility?.amount || 0);
    parentRow.utilitiesTotal = roundCurrency(parentRow.utilitiesTotal + amount);

    const parentPropertyId = normalizePropertyParentId(property);
    if (parentPropertyId && parentRow.childRows[propertyId]) {
      parentRow.childRows[propertyId].utilitiesTotal = roundCurrency(
        parentRow.childRows[propertyId].utilitiesTotal + amount
      );
    }

    const month = String(utility?.billingMonth || '').trim();
    const category = String(utility?.type || 'other').trim().toLowerCase() || 'other';
    if (month) {
      if (!categoryTotalsByMonth[month]) {
        categoryTotalsByMonth[month] = {};
      }
      categoryTotalsByMonth[month][category] = roundCurrency(
        toNumber(categoryTotalsByMonth[month][category]) + amount
      );
    }

    if (!utility?.paidDate) {
      delinquentUtilities.push({
        utilityId: normalizeId(utility?._id),
        propertyId,
        propertyLabel: getPropertyLabel(property, propertyById),
        type: category,
        billingMonth: month,
        dueDate: utility?.dueDate ? new Date(utility.dueDate).toISOString().slice(0, 10) : '',
        amount
      });
    }
  });

  const taxAlerts = [];
  const taxRiskByProperty = {};

  const scopedTaxStatements = propertyTaxStatements.filter((statement) => {
    const propertyId = normalizeId(statement?.propertyId);
    if (!scopedPropertyIds.has(propertyId)) {
      return false;
    }

    const statementDate = getTaxStatementDate(statement);
    return isWithinDateRange(statementDate, startDate, endDate);
  });

  scopedTaxStatements.forEach((statement) => {
    const propertyId = normalizeId(statement?.propertyId);
    const property = propertyById[propertyId];
    if (!property) {
      return;
    }

    const topParentId = resolveTopParentId(property, propertyById);
    const parentRow = parentRowsMap[topParentId];
    if (!parentRow) {
      return;
    }

    const taxSummary = summarizeTaxStatement(statement);

    parentRow.taxDue = roundCurrency(parentRow.taxDue + taxSummary.due);
    parentRow.taxPaid = roundCurrency(parentRow.taxPaid + taxSummary.paid);
    parentRow.taxBalance = roundCurrency(parentRow.taxBalance + taxSummary.balance);

    const splitShares = getTaxSplitShares(statement);
    const hasSplitShares = Object.keys(splitShares).length > 0;
    const parentPropertyId = normalizePropertyParentId(property);

    if (hasSplitShares) {
      Object.entries(splitShares).forEach(([unitId, allocatedDue]) => {
        const childRow = parentRow.childRows[unitId];
        if (!childRow) {
          return;
        }

        const due = roundCurrency(allocatedDue);
        const paidShare =
          taxSummary.due > 0
            ? roundCurrency((taxSummary.paid * due) / taxSummary.due)
            : 0;
        const balance = roundCurrency(Math.max(0, due - paidShare));

        childRow.taxDue = roundCurrency(childRow.taxDue + due);
        childRow.taxPaid = roundCurrency(childRow.taxPaid + paidShare);
        childRow.taxBalance = roundCurrency(childRow.taxBalance + balance);
      });
    } else if (parentPropertyId && parentRow.childRows[propertyId]) {
      parentRow.childRows[propertyId].taxDue = roundCurrency(
        parentRow.childRows[propertyId].taxDue + taxSummary.due
      );
      parentRow.childRows[propertyId].taxPaid = roundCurrency(
        parentRow.childRows[propertyId].taxPaid + taxSummary.paid
      );
      parentRow.childRows[propertyId].taxBalance = roundCurrency(
        parentRow.childRows[propertyId].taxBalance + taxSummary.balance
      );
    }

    if (taxSummary.balance > 0) {
      taxAlerts.push({
        statementId: normalizeId(statement?._id),
        propertyId,
        propertyLabel: getPropertyLabel(property, propertyById),
        taxYearLabel: String(statement?.taxYearLabel || ''),
        totalDue: taxSummary.due,
        totalPaid: taxSummary.paid,
        balance: taxSummary.balance
      });
    }

    if (!taxRiskByProperty[topParentId]) {
      taxRiskByProperty[topParentId] = {
        propertyId: topParentId,
        propertyLabel: parentRow.parentPropertyName,
        currentTotal: 0,
        projectedTotal: 0,
        projectedIncrease: 0,
        projectedIncreasePercent: 0
      };
    }

    taxRiskByProperty[topParentId].currentTotal = roundCurrency(
      taxRiskByProperty[topParentId].currentTotal + taxSummary.due
    );
    taxRiskByProperty[topParentId].projectedTotal = roundCurrency(
      taxRiskByProperty[topParentId].projectedTotal +
        toNumber(taxSummary.estimatedNextYearTotal)
    );
  });

  const parentRows = Object.values(parentRowsMap)
    .map((row) => {
      const childRows = Object.values(row.childRows)
        .map((child) => ({
          ...child,
          combinedCost: roundCurrency(child.utilitiesTotal + child.taxDue)
        }))
        .sort((left, right) => left.propertyName.localeCompare(right.propertyName));

      return {
        ...row,
        combinedCost: roundCurrency(row.utilitiesTotal + row.taxDue),
        childRows
      };
    })
    .sort((left, right) => left.parentPropertyName.localeCompare(right.parentPropertyName));

  const utilityTrendByCategory = Object.entries(categoryTotalsByMonth)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([billingMonth, categories]) => ({
      billingMonth,
      categories,
      total: roundCurrency(
        Object.values(categories).reduce(
          (sum, value) => sum + toNumber(value),
          0
        )
      )
    }));

  const taxProjectionRisk = Object.values(taxRiskByProperty)
    .map((item) => {
      const projectedIncrease = roundCurrency(item.projectedTotal - item.currentTotal);
      const projectedIncreasePercent =
        item.currentTotal > 0
          ? roundCurrency((projectedIncrease / item.currentTotal) * 100)
          : 0;

      return {
        ...item,
        projectedIncrease,
        projectedIncreasePercent,
        riskLevel:
          projectedIncreasePercent >= 15
            ? 'high'
            : projectedIncreasePercent >= 8
              ? 'medium'
              : 'low'
      };
    })
    .sort((left, right) => right.projectedIncreasePercent - left.projectedIncreasePercent);

  const anomalies = buildAnomalyRows(
    scopedUtilities,
    propertyById,
    thresholdPercent,
    lookbackMonths,
    minBillAmount
  );

  return res.json({
    filters: {
      startDate: startDate ? startDate.toISOString().slice(0, 10) : null,
      endDate: endDate ? endDate.toISOString().slice(0, 10) : null,
      propertyId: selectedPropertyId || null,
      includePending,
      anomalyThreshold: thresholdPercent,
      anomalyLookbackMonths: lookbackMonths,
      anomalyMinBillAmount: minBillAmount
    },
    sections: {
      propertyCostBreakdown: parentRows,
      utilityTrendByCategory,
      delinquentAlerts: {
        utilities: delinquentUtilities,
        taxes: taxAlerts
      },
      taxProjectionRisk,
      utilityAnomalies: anomalies
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
  const breakdown =
    fakeRes?.jsonPayload?.sections?.propertyCostBreakdown || [];

  breakdown.forEach((parentRow) => {
    rows.push({
      scope: 'parent',
      parentProperty: parentRow.parentPropertyName,
      property: parentRow.parentPropertyName,
      utilitiesTotal: parentRow.utilitiesTotal,
      taxDue: parentRow.taxDue,
      taxPaid: parentRow.taxPaid,
      taxBalance: parentRow.taxBalance,
      combinedCost: parentRow.combinedCost
    });

    (parentRow.childRows || []).forEach((childRow) => {
      rows.push({
        scope: 'child',
        parentProperty: parentRow.parentPropertyName,
        property: childRow.propertyName,
        utilitiesTotal: childRow.utilitiesTotal,
        taxDue: childRow.taxDue,
        taxPaid: childRow.taxPaid,
        taxBalance: childRow.taxBalance,
        combinedCost: childRow.combinedCost
      });
    });
  });

  const fields = [
    { label: 'Scope', value: 'scope' },
    { label: 'Parent Property', value: 'parentProperty' },
    { label: 'Property', value: 'property' },
    { label: 'Utilities Total', value: 'utilitiesTotal' },
    { label: 'Tax Due', value: 'taxDue' },
    { label: 'Tax Paid', value: 'taxPaid' },
    { label: 'Tax Balance', value: 'taxBalance' },
    { label: 'Combined Cost', value: 'combinedCost' }
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