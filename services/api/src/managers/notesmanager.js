import { Collections } from '@microrealestate/common';
import fs from 'fs-extra';
import { nanoid } from 'nanoid';
import path from 'path';

function ensureEntityType(entityType) {
  const allowed = [
    'property',
    'contact',
    'contract',
    'project',
    'contractor',
    'property_tax_statement'
  ];
  if (!allowed.includes(entityType)) {
    const err = new Error(`Invalid entityType: ${entityType}`);
    err.status = 400;
    throw err;
  }
}

function getAuthorId(req) {
  // In this MicroRealEstate version, req.user is a ServicePrincipal
  // from Middlewares.needAccessToken() (email/clientId/serviceId).
  if (!req.user) return null;
  return req.user.email || req.user.clientId || req.user.serviceId || null;
}

async function validateEntityAccess(entityType, entityId, realmId) {
  const normalizedRealmId = String(realmId);
  // Verify that the entity belongs to the realm for basic access control
  const query = {
    _id: entityId,
    realmId: normalizedRealmId
  };

  let entity = null;

  switch (entityType) {
    case 'property':
      entity = await Collections.Property.findOne(query).lean();
      break;
    case 'contact':
      // Contact/Tenant is stored in Tenant collection
      entity = await Collections.Tenant.findOne(query).lean();
      break;
    case 'contract':
      // Lease/Contract
      entity = await Collections.Lease.findOne(query).lean();
      break;
    case 'project':
      // Project if it exists
      entity = await Collections.Project.findOne(query).lean();
      break;
    case 'contractor':
      // Contractor
      entity = await Collections.Contractor.findOne(query).lean();
      break;
    case 'property_tax_statement':
      entity = await Collections.PropertyTaxStatement.findOne(query).lean();
      break;
    default:
      return false;
  }

  return !!entity;
}

async function enrichNotesWithLabels(notes, realmId) {
  const normalizedRealmId = String(realmId);
  // Enrich each note with a friendly entity label
  // Batch lookups by entity type for efficiency
  const labelsByType = {
    property: {},
    contact: {},
    contract: {},
    project: {},
    contractor: {},
    property_tax_statement: {}
  };

  // First pass: collect all entity IDs we need to look up
  for (const note of notes) {
    if (note.entityType && note.entityId) {
      if (!labelsByType[note.entityType]) {
        labelsByType[note.entityType] = {};
      }
      labelsByType[note.entityType][note.entityId] = null;
    }
  }

  // Load all entities in batch queries
  try {
    if (Object.keys(labelsByType.property).length > 0) {
      const properties = await Collections.Property.find({
        _id: { $in: Object.keys(labelsByType.property) },
        realmId: normalizedRealmId
      })
        .select('_id name')
        .lean();
      properties.forEach((p) => {
        labelsByType.property[String(p._id)] = p.name;
      });
    }

    if (Object.keys(labelsByType.contact).length > 0) {
      const tenants = await Collections.Tenant.find({
        _id: { $in: Object.keys(labelsByType.contact) },
        realmId: normalizedRealmId
      })
        .select('_id name')
        .lean();
      tenants.forEach((t) => {
        labelsByType.contact[String(t._id)] = t.name;
      });
    }

    if (Object.keys(labelsByType.contract).length > 0) {
      const leases = await Collections.Lease.find({
        _id: { $in: Object.keys(labelsByType.contract) },
        realmId: normalizedRealmId
      })
        .select('_id name')
        .lean();
      leases.forEach((l) => {
        labelsByType.contract[String(l._id)] = l.name;
      });
    }

    if (Object.keys(labelsByType.project).length > 0) {
      const projects = await Collections.Project.find({
        _id: { $in: Object.keys(labelsByType.project) },
        realmId: normalizedRealmId
      })
        .select('_id title')
        .lean();
      projects.forEach((p) => {
        labelsByType.project[String(p._id)] = p.title;
      });
    }

    if (Object.keys(labelsByType.contractor).length > 0) {
      const contractors = await Collections.Contractor.find({
        _id: { $in: Object.keys(labelsByType.contractor) },
        realmId: normalizedRealmId
      })
        .select('_id name')
        .lean();
      contractors.forEach((c) => {
        labelsByType.contractor[String(c._id)] = c.name;
      });
    }

    if (Object.keys(labelsByType.property_tax_statement).length > 0) {
      const statements = await Collections.PropertyTaxStatement.find({
        _id: { $in: Object.keys(labelsByType.property_tax_statement) },
        realmId: normalizedRealmId
      })
        .select('_id taxYearLabel')
        .lean();
      statements.forEach((statement) => {
        labelsByType.property_tax_statement[String(statement._id)] =
          statement.taxYearLabel || 'Tax statement';
      });
    }
  } catch (err) {
    // Silently fail if bulk lookups fail
    console.error('Error enriching notes with labels:', err.message);
  }

  // Second pass: add labels to notes
  return notes.map((note) => {
    const label = labelsByType[note.entityType]?.[String(note.entityId)];
    return {
      ...note,
      entityLabel: label || null
    };
  });
}

export async function add(req, res) {
  const { entityType, entityId, content, tags, pinned } = req.body;

  if (!entityType || !entityId || !content) {
    return res
      .status(400)
      .json({ message: 'entityType, entityId, and content are required' });
  }

  ensureEntityType(entityType);

  // Validate access to the entity
  const hasAccess = await validateEntityAccess(
    entityType,
    entityId,
    req.realm?._id
  );

  if (!hasAccess) {
    return res.status(403).json({
      message: 'You do not have access to this resource'
    });
  }

  const authorId = getAuthorId(req);
  if (!authorId) return res.status(401).json({ message: 'Unauthorized' });

  const note = await Collections.Note.create({
    realmId: req.realm?._id,
    entityType,
    entityId: String(entityId),
    authorId: String(authorId),
    authorName: req.user?.name || req.user?.email || String(authorId),
    content: String(content),
    tags: Array.isArray(tags) ? tags : [],
    pinned: !!pinned,
    deletedDate: null
  });

  const enriched = await enrichNotesWithLabels(
    [note.toObject()],
    req.realm?._id
  );
  return res.status(201).json(enriched[0]);
}

export async function one(req, res) {
  const id = req.params.id;

  const note = await Collections.Note.findOne({
    _id: id,
    realmId: req.realm?._id,
    deletedDate: null
  }).lean();

  if (!note) return res.status(404).json({ message: 'Not found' });

  const enriched = await enrichNotesWithLabels([note], req.realm?._id);
  return res.json(enriched[0]);
}

export async function all(req, res) {
  const { entityType, entityId, q } = req.query;

  const filter = {
    realmId: req.realm?._id,
    deletedDate: null
  };

  if (entityType) {
    ensureEntityType(String(entityType));
    filter.entityType = String(entityType);
  }
  if (entityId) {
    filter.entityId = String(entityId);
  }

  // Validate access to specific entity if requested
  if (entityType && entityId) {
    const hasAccess = await validateEntityAccess(
      entityType,
      entityId,
      req.realm?._id
    );

    if (!hasAccess) {
      return res.status(403).json({
        message: 'You do not have access to this resource'
      });
    }
  }

  // Text search if q is provided
  if (q && String(q).trim()) {
    const search = String(q).trim();
    const notes = await Collections.Note.find({
      ...filter,
      $text: { $search: search }
    })
      .sort({ score: { $meta: 'textScore' }, createdDate: -1 })
      .lean();

    const enriched = await enrichNotesWithLabels(notes, req.realm?._id);
    return res.json(enriched);
  }

  const notes = await Collections.Note.find(filter)
    .sort({ pinned: -1, createdDate: -1 })
    .lean();

  const enriched = await enrichNotesWithLabels(notes, req.realm?._id);
  return res.json(enriched);
}

export async function update(req, res) {
  const id = req.params.id;
  const { content, tags, pinned } = req.body;

  // First, find the note to get the entity info for access validation
  const note = await Collections.Note.findOne({
    _id: id,
    realmId: req.realm?._id,
    deletedDate: null
  }).lean();

  if (!note) return res.status(404).json({ message: 'Not found' });

  // Validate access to the entity this note is tied to
  const hasAccess = await validateEntityAccess(
    note.entityType,
    note.entityId,
    req.realm?._id
  );

  if (!hasAccess) {
    return res.status(403).json({
      message: 'You do not have access to this resource'
    });
  }

  const updateDoc = {};
  if (typeof content === 'string') updateDoc.content = content;
  if (Array.isArray(tags)) updateDoc.tags = tags;
  if (typeof pinned === 'boolean') updateDoc.pinned = pinned;

  const updatedNote = await Collections.Note.findOneAndUpdate(
    { _id: id, realmId: req.realm?._id, deletedDate: null },
    { $set: updateDoc },
    { new: true }
  ).lean();

  const enriched = await enrichNotesWithLabels([updatedNote], req.realm?._id);
  return res.json(enriched[0]);
}

export async function remove(req, res) {
  const id = req.params.id;

  // First, find the note to validate access before deleting
  const note = await Collections.Note.findOne({
    _id: id,
    realmId: req.realm?._id,
    deletedDate: null
  }).lean();

  if (!note) return res.status(404).json({ message: 'Not found' });

  // Validate access to the entity this note is tied to
  const hasAccess = await validateEntityAccess(
    note.entityType,
    note.entityId,
    req.realm?._id
  );

  if (!hasAccess) {
    return res.status(403).json({
      message: 'You do not have access to this resource'
    });
  }

  await Collections.Note.findOneAndUpdate(
    { _id: id, realmId: req.realm?._id, deletedDate: null },
    { $set: { deletedDate: new Date() } },
    { new: true }
  ).lean();

  return res.sendStatus(204);
}

export async function uploadAttachment(req, res) {
  const noteId = req.params.id;

  // multer puts the uploaded file on req.file
  if (!req.file) {
    return res
      .status(400)
      .json({ message: 'Missing file (field name must be "file")' });
  }

  const note = await Collections.Note.findOne({
    _id: noteId,
    realmId: req.realm?._id,
    deletedDate: null
  });

  if (!note) {
    return res.status(404).json({ message: 'Note not found' });
  }

  // Ensure upload directory exists
  const uploadDir = path.resolve(process.cwd(), 'data', 'uploads', 'notes');
  await fs.ensureDir(uploadDir);

  // Build a storage key and write file to disk
  const storageKey = `${noteId}_${nanoid(12)}`;
  const filePath = path.join(uploadDir, storageKey);

  await fs.writeFile(filePath, req.file.buffer);

  const uploadedBy =
    req.user?.email || req.user?.clientId || req.user?.serviceId || 'unknown';

  const attachment = {
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    storageKey,
    uploadedBy,
    uploadedAt: new Date()
  };

  note.attachments = note.attachments || [];
  note.attachments.push(attachment);

  await note.save();

  // Return the attachment we just added (including its _id)
  const saved = note.attachments[note.attachments.length - 1];
  return res.status(201).json(saved);
}

export async function downloadAttachment(req, res) {
  const noteId = req.params.id;
  const attachmentId = req.params.attachmentId;

  const note = await Collections.Note.findOne({
    _id: noteId,
    realmId: req.realm?._id,
    deletedDate: null
  }).lean();

  if (!note) return res.status(404).json({ message: 'Note not found' });

  const attachment = (note.attachments || []).find(
    (a) => String(a._id) === String(attachmentId)
  );

  if (!attachment) {
    return res.status(404).json({ message: 'Attachment not found' });
  }

  const filePath = path.resolve(
    process.cwd(),
    'data',
    'uploads',
    'notes',
    attachment.storageKey
  );

  const exists = await fs.pathExists(filePath);
  if (!exists)
    return res.status(404).json({ message: 'File missing on server' });

  res.setHeader(
    'Content-Type',
    attachment.mimeType || 'application/octet-stream'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(attachment.originalName)}"`
  );

  return res.sendFile(filePath);
}
