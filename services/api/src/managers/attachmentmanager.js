/* eslint-disable sort-imports */
import { Collections } from '@microrealestate/common';
import { getUploadsDirectory } from '../utils/storage.js';
import fs from 'fs-extra';
import { nanoid } from 'nanoid';
import path from 'path';

/**
 * Validate that the user has access to the target entity
 */
async function _validateTargetAccess(targetType, targetId, realmId) {
  let targetExists = false;

  switch (targetType) {
    case 'property':
      targetExists = await Collections.Property.exists({
        _id: targetId,
        realmId
      });
      break;
    case 'utility_account':
      targetExists = await Collections.UtilityAccount.exists({
        _id: targetId,
        realmId
      });
      break;
    case 'property_tax_statement':
      targetExists = await Collections.PropertyTaxStatement.exists({
        _id: targetId,
        realmId
      });
      break;
    case 'contact':
    case 'tenant':
      targetExists = await Collections.Tenant.exists({
        _id: targetId,
        realmId
      });
      break;
    case 'contractor':
      targetExists = await Collections.Contractor.exists({
        _id: targetId,
        realmId
      });
      break;
    case 'contractor_work':
      targetExists = await Collections.ContractorWork.exists({
        _id: targetId,
        realmId
      });
      break;
    case 'lease_instance':
      targetExists = await Collections.LeaseInstance.exists({
        _id: targetId,
        realmId
      });
      break;
    case 'contract':
    case 'project':
      // TODO: Implement when Contract and Project collections are added
      // For now, assume valid
      targetExists = true;
      break;
    case 'utility':
      targetExists = await Collections.Utility.exists({
        _id: targetId,
        realmId
      });
      break;
    case 'note':
      targetExists = await Collections.Note.exists({
        _id: targetId,
        realmId
      });
      break;
    default:
      return false;
  }

  return targetExists;
}

/**
 * POST /attachments
 * Upload a file and create an Attachment record
 *
 * Expected:
 * - req.file from multer
 * - req.body: { targetType, targetId, category }
 */
export async function upload(req, res) {
  const realm = req.realm;

  if (!req.file) {
    return res.status(400).json({
      message: 'Missing file (field name must be "file")'
    });
  }

  const { targetType, targetId, category, albumName, accountNumber, billingMonth } = req.body;

  if (!targetType || !targetId) {
    return res.status(400).json({
      message: 'targetType and targetId are required'
    });
  }

  // Validate target entity exists and user has access
  const hasAccess = await _validateTargetAccess(
    targetType,
    targetId,
    realm._id
  );

  if (!hasAccess) {
    return res.status(404).json({
      message: `${targetType} not found or access denied`
    });
  }

  // Ensure upload directory exists
  const uploadDir = getUploadsDirectory('attachments');
  await fs.ensureDir(uploadDir);

  // Organize utility bills by account+month; all other types by targetType/targetId
  const storageKey =
    category === 'utility_bill' && accountNumber && billingMonth
      ? `utility_bills/${String(accountNumber).replace(/[^a-zA-Z0-9-]/g, '_')}/${String(billingMonth).replace(/[^0-9-]/g, '_')}/${nanoid(16)}`
      : `${targetType}/${targetId}/${nanoid(16)}`;

  const filePath = path.join(uploadDir, storageKey);

  // Write file to disk (ensureDir handles subdirectory creation)
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, req.file.buffer);

  // Determine who uploaded
  const uploadedById =
    req.user?._id || req.user?.email || req.user?.clientId || 'unknown';
  const uploadedByName = req.user?.firstname
    ? `${req.user.firstname} ${req.user.lastname || ''}`.trim()
    : req.user?.email || 'Unknown User';

  // Create Attachment document
  const attachment = new Collections.Attachment({
    realmId: realm._id,
    targetType,
    targetId,
    storageKey,
    filename: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    category: category || 'other',
    albumName: albumName || null,
    uploadedById,
    uploadedByName,
    backupStatus: 'pending'
  });

  await attachment.save();

  return res.status(201).json(attachment);
}

/**
 * GET /attachments/:id/download
 * Download a specific attachment by ID
 */
export async function download(req, res) {
  const realm = req.realm;
  const attachmentId = req.params.id;

  const attachment = await Collections.Attachment.findOne({
    _id: attachmentId,
    realmId: realm._id
  }).lean();

  if (!attachment) {
    return res.status(404).json({ message: 'Attachment not found' });
  }

  // Verify user still has access to target entity
  const hasAccess = await _validateTargetAccess(
    attachment.targetType,
    attachment.targetId,
    realm._id
  );

  if (!hasAccess) {
    return res.status(403).json({
      message: 'Access denied to attachment target entity'
    });
  }

  // Build file path
  const filePath = getUploadsDirectory('attachments', attachment.storageKey);

  const exists = await fs.pathExists(filePath);
  if (!exists) {
    return res.status(404).json({
      message:
        attachment.category === 'utility_bill'
          ? 'Bill file not found on disk. Use recapture or re-upload to restore.'
          : 'File missing on server'
    });
  }

  // Set headers and stream file
  res.setHeader(
    'Content-Type',
    attachment.mimeType || 'application/octet-stream'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(attachment.filename)}"`
  );

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}

/**
 * GET /attachments?targetType=<type>&targetId=<id>&category=<cat>
 * List attachments for a specific target entity
 */
export async function list(req, res) {
  const realm = req.realm;
  const { targetType, targetId, category } = req.query;

  if (!targetType || !targetId) {
    return res.status(400).json({
      message: 'targetType and targetId query parameters are required'
    });
  }

  // Verify access to target
  const hasAccess = await _validateTargetAccess(
    targetType,
    targetId,
    realm._id
  );

  if (!hasAccess) {
    return res.status(404).json({
      message: `${targetType} not found or access denied`
    });
  }

  const query = {
    realmId: realm._id,
    targetType,
    targetId
  };

  if (category) {
    query.category = category;
  }

  const attachments = await Collections.Attachment.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return res.json(attachments);
}

/**
 * DELETE /attachments/:id
 * Delete an attachment (file + record)
 */
export async function remove(req, res) {
  const realm = req.realm;
  const attachmentId = req.params.id;

  const attachment = await Collections.Attachment.findOne({
    _id: attachmentId,
    realmId: realm._id
  }).lean();

  if (!attachment) {
    return res.status(404).json({ message: 'Attachment not found' });
  }

  // Verify access to target entity
  const hasAccess = await _validateTargetAccess(
    attachment.targetType,
    attachment.targetId,
    realm._id
  );

  if (!hasAccess) {
    return res.status(403).json({
      message: 'Access denied to attachment target entity'
    });
  }

  // Delete file from disk
  const filePath = path.resolve(
    process.cwd(),
    'data',
    'uploads',
    'attachments',
    attachment.storageKey
  );

  try {
    await fs.remove(filePath);
  } catch (err) {
    // File might not exist, log but continue
    console.warn(`Failed to delete file ${filePath}:`, err.message);
  }

  // Delete database record
  await Collections.Attachment.deleteOne({
    _id: attachmentId,
    realmId: realm._id
  });

  return res.sendStatus(204);
}
