import { Collections } from '@microrealestate/common';
import { getOneDriveService } from '../services/onedrive.js';
import path from 'path';

/**
 * Process pending attachment backups
 * @param {Object} options - Processing options
 * @param {number} options.limit - Maximum number of attachments to process in one run
 * @param {boolean} options.retryFailed - Whether to retry previously failed backups
 * @returns {Promise<Object>} - Processing results
 */
export async function processBackups(options = {}) {
  const { limit = 50, retryFailed = true } = options;

  const oneDriveService = getOneDriveService();

  if (!oneDriveService.isEnabled()) {
    return {
      success: false,
      message: 'OneDrive backup is not enabled',
      processed: 0,
      succeeded: 0,
      failed: 0
    };
  }

  // Build query for attachments to back up
  const query = {
    backupStatus: { $in: ['pending'] }
  };

  if (retryFailed) {
    query.backupStatus.$in.push('failed');
  }

  // Find attachments that need backing up
  const attachments = await Collections.Attachment.find(query)
    .limit(limit)
    .sort({ createdAt: 1 }) // Process oldest first
    .lean();

  if (attachments.length === 0) {
    return {
      success: true,
      message: 'No attachments pending backup',
      processed: 0,
      succeeded: 0,
      failed: 0
    };
  }

  const results = {
    processed: attachments.length,
    succeeded: 0,
    failed: 0,
    errors: []
  };

  // Process each attachment
  for (const attachment of attachments) {
    try {
      // Build local file path
      const localFilePath = path.resolve(
        process.cwd(),
        'data',
        'uploads',
        'attachments',
        attachment.storageKey
      );

      // Build OneDrive path
      const oneDrivePath = oneDriveService.buildBackupPath(attachment);

      // Upload to OneDrive
      await oneDriveService.uploadFile(localFilePath, oneDrivePath);

      // Update attachment record
      await Collections.Attachment.updateOne(
        { _id: attachment._id },
        {
          $set: {
            backupProvider: 'onedrive',
            backupPath: oneDrivePath,
            backupStatus: 'success',
            backupLastTriedAt: new Date(),
            backupError: null
          }
        }
      );

      results.succeeded++;
    } catch (error) {
      // Update attachment with error
      await Collections.Attachment.updateOne(
        { _id: attachment._id },
        {
          $set: {
            backupStatus: 'failed',
            backupLastTriedAt: new Date(),
            backupError: error.message
          }
        }
      );

      results.failed++;
      results.errors.push({
        attachmentId: attachment._id,
        filename: attachment.filename,
        error: error.message
      });
    }
  }

  return {
    success: true,
    ...results
  };
}

/**
 * Backup a specific attachment by ID (manual trigger)
 */
export async function backupSingleAttachment(attachmentId, realmId) {
  const oneDriveService = getOneDriveService();

  if (!oneDriveService.isEnabled()) {
    throw new Error('OneDrive backup is not enabled');
  }

  const attachment = await Collections.Attachment.findOne({
    _id: attachmentId,
    realmId
  }).lean();

  if (!attachment) {
    throw new Error('Attachment not found');
  }

  const localFilePath = path.resolve(
    process.cwd(),
    'data',
    'uploads',
    'attachments',
    attachment.storageKey
  );

  const oneDrivePath = oneDriveService.buildBackupPath(attachment);

  try {
    await oneDriveService.uploadFile(localFilePath, oneDrivePath);

    await Collections.Attachment.updateOne(
      { _id: attachment._id },
      {
        $set: {
          backupProvider: 'onedrive',
          backupPath: oneDrivePath,
          backupStatus: 'success',
          backupLastTriedAt: new Date(),
          backupError: null
        }
      }
    );

    return {
      success: true,
      attachment: {
        ...attachment,
        backupProvider: 'onedrive',
        backupPath: oneDrivePath,
        backupStatus: 'success'
      }
    };
  } catch (error) {
    await Collections.Attachment.updateOne(
      { _id: attachment._id },
      {
        $set: {
          backupStatus: 'failed',
          backupLastTriedAt: new Date(),
          backupError: error.message
        }
      }
    );

    throw error;
  }
}

/**
 * Get backup statistics
 */
export async function getBackupStats(realmId) {
  const query = realmId ? { realmId } : {};

  const stats = await Collections.Attachment.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$backupStatus',
        count: { $sum: 1 },
        totalSize: { $sum: '$size' }
      }
    }
  ]);

  const result = {
    total: 0,
    pending: 0,
    success: 0,
    failed: 0,
    totalSize: 0,
    backedUpSize: 0
  };

  stats.forEach((stat) => {
    const status = stat._id || 'unknown';
    result.total += stat.count;
    result.totalSize += stat.totalSize;

    if (status === 'success') {
      result.success = stat.count;
      result.backedUpSize = stat.totalSize;
    } else if (status === 'pending') {
      result.pending = stat.count;
    } else if (status === 'failed') {
      result.failed = stat.count;
    }
  });

  return result;
}
