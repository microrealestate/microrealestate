import { Collections } from '@microrealestate/common';

function _getUserFullName(req) {
  const u = req.user || {};
  return [u.firstname, u.lastname].filter(Boolean).join(' ') || u.email || '';
}

// ─── List / Get ─────────────────────────────────────────────────────────────

export async function listInvoices(req, res) {
  const { realmId } = req.realm._id ? { realmId: req.realm._id } : {};
  const query = { realmId: req.realm._id };

  if (req.query.occupantId) query.occupantId = String(req.query.occupantId);
  if (req.query.utilityId) query.utilityId = String(req.query.utilityId);
  if (req.query.billingMonth) query.billingMonth = String(req.query.billingMonth);
  if (req.query.status) query.status = String(req.query.status);

  const invoices = await Collections.UtilityInvoice.find(query)
    .sort({ billingMonth: -1, occupantName: 1 })
    .lean();

  return res.json(invoices);
}

export async function getInvoice(req, res) {
  const invoice = await Collections.UtilityInvoice.findOne({
    _id: req.params.id,
    realmId: req.realm._id
  }).lean();

  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }
  return res.json(invoice);
}

// ─── Generate Invoices ───────────────────────────────────────────────────────

export async function generateInvoices(req, res) {
  const realmId = req.realm._id;
  const { utilityId } = req.body || {};

  if (!utilityId) {
    return res.status(400).json({ message: 'utilityId is required' });
  }

  const utility = await Collections.Utility.findOne({
    _id: String(utilityId),
    realmId
  }).lean();

  if (!utility) {
    return res.status(404).json({ message: 'Utility entry not found' });
  }

  if (utility.invoicedAt) {
    return res
      .status(409)
      .json({ message: 'Invoices have already been generated for this utility bill' });
  }

  // Find occupants assigned to this property AND any child units/spaces under it
  const childProperties = await Collections.Property.find({
    realmId,
    parentPropertyId: String(utility.propertyId)
  })
    .select('_id')
    .lean();

  const allPropertyIds = [
    String(utility.propertyId),
    ...childProperties.map((p) => String(p._id))
  ];

  const occupants = await Collections.Tenant.find({
    realmId,
    'properties.propertyId': { $in: allPropertyIds }
  })
    .select('_id name contacts properties beginDate endDate terminationDate')
    .lean();

  if (!occupants.length) {
    return res.status(422).json({
      message: 'No active occupants found for this property — no invoices generated'
    });
  }

  const actor = _getUserFullName(req);
  const now = new Date();

  const invoiceDocs = occupants.map((occupant, index) => ({
    realmId,
    occupantId: String(occupant._id),
    occupantEmail: (occupant.contacts?.[0]?.email || ''),
    utilityId: String(utility._id),
    billingMonth: utility.billingMonth,
    propertyId: String(utility.propertyId),
    invoiceAmount: utility.amount,
    invoiceNumber: `UTL-${utility.billingMonth}-${String(index + 1).padStart(3, '0')}`,
    status: 'draft'
  }));

  const createdInvoices = await Collections.UtilityInvoice.insertMany(invoiceDocs, {
    ordered: true
  });

  // Stamp the utility as invoiced so it cannot be edited
  await Collections.Utility.updateOne(
    { _id: utility._id },
    { invoicedAt: now, invoicedBy: actor }
  );

  // Append-only activity log entry
  await Collections.UtilityActivity.create({
    realmId,
    utilityId: String(utility._id),
    eventType: 'invoiced',
    actor,
    timestamp: now,
    details: {
      invoiceIds: createdInvoices.map((i) => String(i._id)),
      invoiceId: String(createdInvoices[0]?._id || ''),
      invoiceAmount: utility.amount
    }
  });

  return res
    .status(201)
    .json(createdInvoices.map((invoice) => invoice.toObject()));
}

// ─── Send Invoice ────────────────────────────────────────────────────────────

export async function sendInvoice(req, res) {
  const invoice = await Collections.UtilityInvoice.findOne({
    _id: req.params.id,
    realmId: req.realm._id
  }).lean();

  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  if (!['draft', 'outstanding'].includes(invoice.status)) {
    return res
      .status(409)
      .json({ message: `Cannot send an invoice with status '${invoice.status}'` });
  }

  const actor = _getUserFullName(req);
  const now = new Date();

  const updated = await Collections.UtilityInvoice.findOneAndUpdate(
    { _id: invoice._id },
    { status: 'outstanding', sentAt: now, sentBy: actor },
    { new: true }
  ).lean();

  await Collections.UtilityActivity.create({
    realmId: req.realm._id,
    utilityId: invoice.utilityId,
    eventType: 'invoice_sent',
    actor,
    timestamp: now,
    details: { invoiceIds: [String(invoice._id)], invoiceId: String(invoice._id) }
  });

  return res.json(updated);
}

// ─── Mark Paid ───────────────────────────────────────────────────────────────

export async function markPaid(req, res) {
  const invoice = await Collections.UtilityInvoice.findOne({
    _id: req.params.id,
    realmId: req.realm._id
  }).lean();

  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  if (invoice.status === 'paid') {
    return res.status(409).json({ message: 'Invoice is already marked as paid' });
  }

  if (invoice.status === 'void') {
    return res.status(409).json({ message: 'Cannot mark a voided invoice as paid' });
  }

  const { paymentMethod, paymentReference, paymentNotes } = req.body || {};
  const actor = _getUserFullName(req);
  const now = new Date();

  const updated = await Collections.UtilityInvoice.findOneAndUpdate(
    { _id: invoice._id },
    {
      status: 'paid',
      paidAt: now,
      paidBy: actor,
      paymentMethod: String(paymentMethod || ''),
      paymentReference: String(paymentReference || ''),
      paymentNotes: String(paymentNotes || '')
    },
    { new: true }
  ).lean();

  await Collections.UtilityActivity.create({
    realmId: req.realm._id,
    utilityId: invoice.utilityId,
    eventType: 'payment_received',
    actor,
    timestamp: now,
    details: {
      invoiceId: String(invoice._id),
      paidAmount: invoice.invoiceAmount,
      paymentMethod: String(paymentMethod || ''),
      paymentReference: String(paymentReference || '')
    }
  });

  return res.json(updated);
}

// ─── Void Invoice ────────────────────────────────────────────────────────────

export async function voidInvoice(req, res) {
  const invoice = await Collections.UtilityInvoice.findOne({
    _id: req.params.id,
    realmId: req.realm._id
  }).lean();

  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  if (invoice.status === 'void') {
    return res.status(409).json({ message: 'Invoice is already voided' });
  }

  if (invoice.status === 'paid') {
    return res.status(409).json({ message: 'Cannot void a paid invoice' });
  }

  const actor = _getUserFullName(req);
  const now = new Date();

  const updated = await Collections.UtilityInvoice.findOneAndUpdate(
    { _id: invoice._id },
    {
      status: 'void',
      voidedAt: now,
      voidedBy: actor,
      voidReason: String((req.body || {}).reason || '')
    },
    { new: true }
  ).lean();

  return res.json(updated);
}

// ─── QB Posted Log ───────────────────────────────────────────────────────────

export async function logQbPosted(req, res) {
  const realmId = req.realm._id;
  const utilityId = req.params.id;

  const utility = await Collections.Utility.findOne({
    _id: utilityId,
    realmId
  })
    .select('_id')
    .lean();

  if (!utility) {
    return res.status(404).json({ message: 'Utility entry not found' });
  }

  const { qbReference, notes } = req.body || {};
  const actor = _getUserFullName(req);
  const now = new Date();

  const activity = await Collections.UtilityActivity.create({
    realmId,
    utilityId: String(utilityId),
    eventType: 'qb_posted',
    actor,
    timestamp: now,
    details: {
      qbPostedAt: now,
      qbReference: String(qbReference || '')
    },
    notes: String(notes || '')
  });

  // Persist QB status directly on the Utility so the UI can reflect state without querying activity log
  const updated = await Collections.Utility.findByIdAndUpdate(
    utilityId,
    { qbPostedAt: now, qbPostedBy: actor },
    { new: true }
  ).lean();

  return res.status(201).json({ activity: activity.toObject(), utility: updated });
}

// ─── Outstanding Summary ─────────────────────────────────────────────────────

export async function outstandingSummary(req, res) {
  const realmId = req.realm._id;

  const outstanding = await Collections.UtilityInvoice.find({
    realmId,
    status: { $in: ['outstanding', 'sent'] }
  })
    .sort({ occupantName: 1, billingMonth: -1 })
    .lean();

  // Group by occupant
  const byOccupant = outstanding.reduce((acc, invoice) => {
    const key = String(invoice.occupantId);
    if (!acc[key]) {
      acc[key] = {
        occupantId: key,
        occupantEmail: invoice.occupantEmail,
        totalOutstanding: 0,
        invoiceCount: 0,
        invoices: []
      };
    }
    acc[key].totalOutstanding += invoice.invoiceAmount || 0;
    acc[key].invoiceCount += 1;
    acc[key].invoices.push(invoice);
    return acc;
  }, {});

  return res.json(Object.values(byOccupant));
}
