import { Collections } from '@microrealestate/common';

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

function normalizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function roundCurrency(value) {
  return Number((Number(value || 0) + Number.EPSILON).toFixed(2));
}

function normalizeAllocations(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item?.propertyId)
    .map((item) => ({
      propertyId: String(item.propertyId),
      percentage: Number(item.percentage)
    }));
}

function normalizeAllocationsForComparison(items = []) {
  return normalizeAllocations(items)
    .map((item) => ({
      propertyId: String(item.propertyId),
      percentage: Number(Number(item.percentage || 0).toFixed(6))
    }))
    .sort((left, right) => left.propertyId.localeCompare(right.propertyId));
}

function areAllocationsEqual(left = [], right = []) {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (
      String(left[index].propertyId) !== String(right[index].propertyId) ||
      Number(left[index].percentage) !== Number(right[index].percentage)
    ) {
      return false;
    }
  }

  return true;
}

function buildChangedBy(user = {}) {
  return normalizeText(
    user?.email ||
      [user?.firstname, user?.lastname].filter(Boolean).join(' ') ||
      user?._id ||
      ''
  );
}

function normalizeAccountPayload(payload) {
  return {
    type: normalizeType(payload.type) || 'other',
    provider: normalizeText(payload.provider),
    accountNumber: normalizeText(payload.accountNumber),
    notes: normalizeText(payload.notes),
    allocations: normalizeAllocations(payload.allocations)
  };
}

function normalizeBillPayload(payload) {
  return {
    billingMonth: normalizeMonth(payload.billingMonth),
    amount: Number(payload.amount),
    dueDate: payload.dueDate || null,
    paidDate: payload.paidDate || null,
    notes: normalizeText(payload.notes),
    attachmentIds: Array.isArray(payload.attachmentIds)
      ? payload.attachmentIds.map((id) => String(id))
      : []
  };
}

async function validateAllocations(realmId, allocations) {
  if (!allocations.length) {
    return 'At least one allocation is required';
  }

  const propertyIds = allocations.map((item) => item.propertyId);
  const uniquePropertyIds = new Set(propertyIds);

  if (uniquePropertyIds.size !== propertyIds.length) {
    return 'Each property or sub property can only be assigned once per account';
  }

  if (
    allocations.some(
      (item) => !Number.isFinite(item.percentage) || item.percentage <= 0
    )
  ) {
    return 'Allocation percentages must be positive numbers';
  }

  const percentageTotal = allocations.reduce(
    (sum, item) => sum + Number(item.percentage || 0),
    0
  );

  if (Math.abs(percentageTotal - 100) > 0.01) {
    return 'Allocation percentages must add up to 100';
  }

  const properties = await Collections.Property.find({
    _id: { $in: Array.from(uniquePropertyIds) },
    realmId
  })
    .select('_id')
    .lean();

  if (properties.length !== uniquePropertyIds.size) {
    return 'All allocations must reference properties in this organization';
  }

  return null;
}

async function validateAccountPayload(
  realmId,
  payload,
  utilityAccountId = null
) {
  if (!payload.accountNumber) {
    return 'accountNumber is required';
  }

  if (!payload.type) {
    return 'type is required';
  }

  const allocationError = await validateAllocations(
    realmId,
    payload.allocations
  );
  if (allocationError) {
    return allocationError;
  }

  const duplicateQuery = {
    realmId,
    accountNumber: payload.accountNumber
  };

  if (utilityAccountId) {
    duplicateQuery._id = { $ne: utilityAccountId };
  }

  const duplicate = await Collections.UtilityAccount.findOne(duplicateQuery)
    .select('_id')
    .lean();

  if (duplicate) {
    return 'An account with this account number already exists';
  }

  return null;
}

function buildSplitItems(unitAllocations, groupPercentage) {
  if (!unitAllocations.length || !groupPercentage) {
    return [];
  }

  const combinedAllocations = new Map();

  unitAllocations.forEach((allocation) => {
    combinedAllocations.set(
      allocation.propertyId,
      Number(combinedAllocations.get(allocation.propertyId) || 0) +
        Number(allocation.percentage || 0)
    );
  });

  const entries = Array.from(combinedAllocations.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  let remainingPercentage = 100;

  return entries.map(([propertyId, percentage], index) => {
    const isLast = index === entries.length - 1;
    const nextPercentage = isLast
      ? Number(remainingPercentage.toFixed(6))
      : Number(((percentage / groupPercentage) * 100).toFixed(6));

    remainingPercentage -= nextPercentage;

    return {
      subPropertyId: propertyId,
      splitType: 'percentage',
      percentage: nextPercentage
    };
  });
}

async function validateBillAttachments(
  realmId,
  utilityAccountId,
  attachmentIds
) {
  if (!attachmentIds.length) {
    return null;
  }

  const attachmentCount = await Collections.Attachment.countDocuments({
    _id: { $in: attachmentIds },
    realmId,
    targetType: 'utility_account',
    targetId: utilityAccountId,
    category: 'utility_bill'
  });

  if (attachmentCount !== attachmentIds.length) {
    return 'All attachmentIds must be utility bill files for this account';
  }

  return null;
}

export async function all(req, res) {
  const utilityAccounts = await Collections.UtilityAccount.find({
    realmId: req.realm._id
  })
    .sort({ type: 1, accountNumber: 1, createdAt: -1 })
    .lean();

  return res.json(utilityAccounts);
}

export async function one(req, res) {
  const utilityAccount = await Collections.UtilityAccount.findOne({
    _id: req.params.id,
    realmId: req.realm._id
  }).lean();

  if (!utilityAccount) {
    return res.status(404).json({ message: 'Utility account not found' });
  }

  return res.json(utilityAccount);
}

export async function add(req, res) {
  const payload = normalizeAccountPayload(req.body || {});
  const validationError = await validateAccountPayload(req.realm._id, payload);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const utilityAccount = new Collections.UtilityAccount({
    realmId: req.realm._id,
    ...payload
  });

  await utilityAccount.save();

  return res.status(201).json(utilityAccount.toObject());
}

export async function update(req, res) {
  const payload = normalizeAccountPayload(req.body || {});
  const validationError = await validateAccountPayload(
    req.realm._id,
    payload,
    req.params.id
  );

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const existingAccount = await Collections.UtilityAccount.findOne({
    _id: req.params.id,
    realmId: req.realm._id
  }).lean();

  if (!existingAccount) {
    return res.status(404).json({ message: 'Utility account not found' });
  }

  const previousAllocations = normalizeAllocationsForComparison(
    existingAccount.allocations
  );
  const nextAllocations = normalizeAllocationsForComparison(
    payload.allocations
  );

  let allocationHistory = Array.isArray(existingAccount.allocationHistory)
    ? existingAccount.allocationHistory
    : [];

  if (!areAllocationsEqual(previousAllocations, nextAllocations)) {
    const historyEntry = {
      changedAt: new Date(),
      changedBy: buildChangedBy(req.user),
      previousAllocations,
      nextAllocations
    };

    allocationHistory = [historyEntry, ...allocationHistory].slice(0, 50);
  }

  const utilityAccount = await Collections.UtilityAccount.findOneAndUpdate(
    {
      _id: req.params.id,
      realmId: req.realm._id
    },
    {
      ...payload,
      allocationHistory
    },
    { new: true }
  ).lean();

  return res.json(utilityAccount);
}

export async function remove(req, res) {
  const result = await Collections.UtilityAccount.deleteOne({
    _id: req.params.id,
    realmId: req.realm._id
  });

  if (!result.deletedCount) {
    return res.status(404).json({ message: 'Utility account not found' });
  }

  return res.sendStatus(204);
}

export async function addBill(req, res) {
  const realmId = req.realm._id;
  const utilityAccountId = req.params.id;
  const payload = normalizeBillPayload(req.body || {});

  const utilityAccount = await Collections.UtilityAccount.findOne({
    _id: utilityAccountId,
    realmId
  }).lean();

  if (!utilityAccount) {
    return res.status(404).json({ message: 'Utility account not found' });
  }

  if (!payload.billingMonth) {
    return res
      .status(400)
      .json({ message: 'billingMonth must use YYYY-MM format' });
  }

  if (!Number.isFinite(payload.amount) || payload.amount < 0) {
    return res
      .status(400)
      .json({ message: 'amount must be a positive number' });
  }

  const attachmentError = await validateBillAttachments(
    realmId,
    utilityAccountId,
    payload.attachmentIds
  );

  if (attachmentError) {
    return res.status(400).json({ message: attachmentError });
  }

  const allocatedPropertyIds = utilityAccount.allocations.map(
    (allocation) => allocation.propertyId
  );
  const allocatedProperties = await Collections.Property.find({
    _id: { $in: allocatedPropertyIds },
    realmId
  })
    .select('_id name parentPropertyId')
    .lean();

  if (allocatedProperties.length !== allocatedPropertyIds.length) {
    return res.status(400).json({
      message: 'One or more account allocations reference missing properties'
    });
  }

  const propertyById = new Map(
    allocatedProperties.map((property) => [String(property._id), property])
  );

  const groupedAllocations = new Map();

  utilityAccount.allocations.forEach((allocation) => {
    const property = propertyById.get(String(allocation.propertyId));
    const rootPropertyId = property?.parentPropertyId
      ? String(property.parentPropertyId)
      : String(property._id);

    if (!groupedAllocations.has(rootPropertyId)) {
      groupedAllocations.set(rootPropertyId, {
        rootPropertyId,
        totalPercentage: 0,
        unitAllocations: []
      });
    }

    const group = groupedAllocations.get(rootPropertyId);
    group.totalPercentage += Number(allocation.percentage || 0);

    if (property?.parentPropertyId) {
      group.unitAllocations.push({
        propertyId: String(property._id),
        percentage: Number(allocation.percentage || 0)
      });
    }
  });

  const rootPropertyIds = Array.from(groupedAllocations.keys());
  const rootProperties = await Collections.Property.find({
    _id: { $in: rootPropertyIds },
    realmId
  })
    .select('_id name')
    .lean();

  if (rootProperties.length !== rootPropertyIds.length) {
    return res.status(400).json({
      message: 'One or more root properties for this account no longer exist'
    });
  }

  const duplicates = await Collections.Utility.find({
    realmId,
    propertyId: { $in: rootPropertyIds },
    type: utilityAccount.type,
    billingMonth: payload.billingMonth
  })
    .select('propertyId')
    .lean();

  if (duplicates.length) {
    const rootPropertyById = new Map(
      rootProperties.map((property) => [String(property._id), property.name])
    );
    const duplicateNames = duplicates.map(
      (duplicate) =>
        rootPropertyById.get(String(duplicate.propertyId)) || 'Unknown property'
    );

    return res.status(400).json({
      message: `Utility entries already exist for ${duplicateNames.join(', ')} in ${payload.billingMonth}`
    });
  }

  const groups = Array.from(groupedAllocations.values()).sort((a, b) =>
    a.rootPropertyId.localeCompare(b.rootPropertyId)
  );

  let allocatedAmount = 0;
  const utilitiesToCreate = groups.map((group, index) => {
    const isLast = index === groups.length - 1;
    const amount = isLast
      ? roundCurrency(payload.amount - allocatedAmount)
      : roundCurrency((payload.amount * group.totalPercentage) / 100);

    allocatedAmount += amount;

    const splitItems = buildSplitItems(
      group.unitAllocations,
      Number(group.totalPercentage || 0)
    );

    return {
      realmId,
      propertyId: group.rootPropertyId,
      type: utilityAccount.type,
      provider: utilityAccount.provider || '',
      accountNumber: utilityAccount.accountNumber,
      billingMonth: payload.billingMonth,
      amount,
      dueDate: payload.dueDate,
      paidDate: payload.paidDate,
      notes: payload.notes,
      attachmentIds: payload.attachmentIds,
      splitMethod: splitItems.length ? 'percentage' : 'equal',
      splitItems
    };
  });

  const createdUtilities = await Collections.Utility.insertMany(
    utilitiesToCreate,
    {
      ordered: true
    }
  );

  return res
    .status(201)
    .json(createdUtilities.map((utility) => utility.toObject()));
}
