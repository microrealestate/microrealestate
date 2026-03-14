import { Collections, logger } from '@microrealestate/common';

/**
 * Build the user's display name from the request.
 */
function _getUserInfo(req) {
  const user = req.user || {};
  const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ');
  return {
    userId: String(user._id || user.clientId || ''),
    userEmail: user.email || '',
    userFullName: fullName || user.email || ''
  };
}

/**
 * Create an audit log entry. Failures are swallowed so they never break the
 * primary operation.
 */
export async function createLog(
  req,
  action,
  entityType,
  entityId,
  entityName,
  changes = []
) {
  try {
    const { userId, userEmail, userFullName } = _getUserInfo(req);
    await new Collections.AuditLog({
      realmId: req.realm._id,
      userId,
      userEmail,
      userFullName,
      action,
      entityType,
      entityId: String(entityId || ''),
      entityName: String(entityName || ''),
      changes
    }).save();
  } catch (err) {
    logger.error('Failed to write audit log entry:', err);
  }
}

/**
 * Compute a flat list of changed fields between two plain objects.
 * Only top-level primitive fields are compared (complex nested objects are
 * represented as JSON strings so they still show up in the log).
 */
export function diffObjects(oldObj, newObj, skipFields = []) {
  const skip = new Set([
    '_id',
    '__v',
    'realmId',
    'createdAt',
    'updatedAt',
    'lastUpdatedBy',
    ...skipFields
  ]);

  const allKeys = new Set([
    ...Object.keys(oldObj || {}),
    ...Object.keys(newObj || {})
  ]);

  const changes = [];
  for (const key of allKeys) {
    if (skip.has(key)) {
      continue;
    }
    const oldVal = oldObj ? oldObj[key] : undefined;
    const newVal = newObj ? newObj[key] : undefined;

    const oldStr =
      oldVal === null || oldVal === undefined
        ? null
        : typeof oldVal === 'object'
          ? JSON.stringify(oldVal)
          : String(oldVal);
    const newStr =
      newVal === null || newVal === undefined
        ? null
        : typeof newVal === 'object'
          ? JSON.stringify(newVal)
          : String(newVal);

    if (oldStr !== newStr) {
      changes.push({
        field: key,
        oldValue: oldVal ?? null,
        newValue: newVal ?? null
      });
    }
  }

  return changes;
}

////////////////////////////////////////////////////////////////////////////////
// HTTP handlers
////////////////////////////////////////////////////////////////////////////////

/**
 * GET /api/v2/audit-logs
 *
 * Query params:
 *   entityType  – filter by entity type (property|lease|utility|tax)
 *   action      – filter by action     (create|update|delete)
 *   limit       – max results          (default 200, max 1000)
 *   skip        – pagination offset    (default 0)
 */
export async function all(req, res) {
  const realm = req.realm;
  const { entityType, action, limit: rawLimit, skip: rawSkip } = req.query;

  const filter = { realmId: realm._id };
  if (entityType) filter.entityType = entityType;
  if (action) filter.action = action;

  const limit = Math.min(Math.max(Number(rawLimit) || 200, 1), 1000);
  const skip = Math.max(Number(rawSkip) || 0, 0);

  const [logs, total] = await Promise.all([
    Collections.AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Collections.AuditLog.countDocuments(filter)
  ]);

  return res.json({ logs, total, limit, skip });
}
