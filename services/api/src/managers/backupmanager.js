import * as backupWorker from '../workers/backupworker.js';

/**
 * POST /backups/process
 * Manually trigger backup processing
 */
export async function processBackups(req, res) {
  const { limit, retryFailed } = req.body;

  try {
    const result = await backupWorker.processBackups({
      limit: limit || 50,
      retryFailed: retryFailed !== false
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * POST /backups/attachment/:id
 * Backup a specific attachment
 */
export async function backupOne(req, res) {
  const realm = req.realm;
  const attachmentId = req.params.id;

  try {
    const result = await backupWorker.backupSingleAttachment(
      attachmentId,
      realm._id
    );

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * GET /backups/stats
 * Get backup statistics
 */
export async function stats(req, res) {
  const realm = req.realm;

  try {
    const statistics = await backupWorker.getBackupStats(realm._id);
    return res.json(statistics);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
