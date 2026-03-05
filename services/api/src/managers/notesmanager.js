import { Collections } from '@microrealestate/common';
import path from 'path';
import fs from 'fs-extra';
import { nanoid } from 'nanoid';
import mime from 'mime-types';

function ensureEntityType(entityType) {
  const allowed = ['property', 'contact', 'contract', 'project'];
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

export async function add(req, res) {
  const { entityType, entityId, content, tags, pinned } = req.body;

  if (!entityType || !entityId || !content) {
    return res
      .status(400)
      .json({ message: 'entityType, entityId, and content are required' });
  }

  ensureEntityType(entityType);

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

  return res.status(201).json(note);
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

  // Text search if q is provided
  if (q && String(q).trim()) {
    const search = String(q).trim();
    const notes = await Collections.Note.find({
      ...filter,
      $text: { $search: search }
    })
      .sort({ score: { $meta: 'textScore' }, createdDate: -1 })
      .lean();

    return res.json(notes);
  }

  const notes = await Collections.Note.find(filter)
    .sort({ pinned: -1, createdDate: -1 })
    .lean();

  return res.json(notes);
}

export async function update(req, res) {
  const id = req.params.id;
  const { content, tags, pinned } = req.body;

  const updateDoc = {};
  if (typeof content === 'string') updateDoc.content = content;
  if (Array.isArray(tags)) updateDoc.tags = tags;
  if (typeof pinned === 'boolean') updateDoc.pinned = pinned;

  const note = await Collections.Note.findOneAndUpdate(
    { _id: id, realmId: req.realm?._id, deletedDate: null },
    { $set: updateDoc },
    { new: true }
  ).lean();

  if (!note) return res.status(404).json({ message: 'Not found' });
  return res.json(note);
}

export async function remove(req, res) {
  const id = req.params.id;

  const note = await Collections.Note.findOneAndUpdate(
    { _id: id, realmId: req.realm?._id, deletedDate: null },
    { $set: { deletedDate: new Date() } },
    { new: true }
  ).lean();

  if (!note) return res.status(404).json({ message: 'Not found' });
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