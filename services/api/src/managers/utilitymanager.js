import { Collections } from '@microrealestate/common';

function normalizeMonth(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return /^\d{4}-\d{2}$/.test(trimmed) ? trimmed : null;
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
    type: payload.type || 'other',
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

  const validationError = await validatePayload(realm._id, payload);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const utility = new Collections.Utility({
    realmId: realm._id,
    ...payload
  });

  await utility.save();

  return res.status(201).json(utility.toObject());
}

export async function update(req, res) {
  const realm = req.realm;
  const utilityId = req.params.id;
  const payload = normalizePayload(req.body || {});

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

  return res.json(utility);
}

export async function remove(req, res) {
  const realm = req.realm;

  const result = await Collections.Utility.deleteOne({
    _id: req.params.id,
    realmId: realm._id
  });

  if (result.deletedCount === 0) {
    return res.status(404).json({ message: 'Utility entry not found' });
  }

  return res.sendStatus(204);
}
