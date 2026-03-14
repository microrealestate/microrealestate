import { logger, Service } from '@microrealestate/common';
import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';

const BACKUP_BASE_DIR = '/backup/db';

function getMongoUrl() {
  const { MONGO_URL } = Service.getInstance().envConfig.getValues();
  return MONGO_URL || 'mongodb://mongo/mredb';
}

function makeTimestampedName() {
  return new Date()
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');
}

function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout = [];
    const stderr = [];

    proc.stdout.on('data', (d) => stdout.push(d));
    proc.stderr.on('data', (d) => stderr.push(d));

    proc.on('close', (code) => {
      const out = Buffer.concat(stdout).toString();
      const err = Buffer.concat(stderr).toString();
      if (code === 0) {
        resolve({ out, err });
      } else {
        reject(new Error(`Command exited with code ${code}:\n${err}`));
      }
    });

    proc.on('error', reject);
  });
}

async function listBackups() {
  await fs.ensureDir(BACKUP_BASE_DIR);
  const entries = await fs.readdir(BACKUP_BASE_DIR, { withFileTypes: true });
  const backups = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const fullPath = path.join(BACKUP_BASE_DIR, entry.name);
    const stat = await fs.stat(fullPath);
    backups.push({
      name: entry.name,
      createdAt: stat.birthtime || stat.ctime,
      path: fullPath
    });
  }

  return backups.sort((a, b) => b.createdAt - a.createdAt);
}

////////////////////////////////////////////////////////////////////////////////
// HTTP handlers
////////////////////////////////////////////////////////////////////////////////

/**
 * GET /api/v2/db-backups
 * List all DB backup snapshots.
 */
export async function list(req, res) {
  const backups = await listBackups();
  return res.json(backups.map(({ name, createdAt }) => ({ name, createdAt })));
}

/**
 * POST /api/v2/db-backups
 * Create a new backup snapshot using mongodump.
 */
export async function create(req, res) {
  const mongoUrl = getMongoUrl();
  const snapshotName = makeTimestampedName();
  const snapshotDir = path.join(BACKUP_BASE_DIR, snapshotName);

  await fs.ensureDir(snapshotDir);

  logger.info(`Starting DB backup: ${snapshotName}`);

  await runCommand('mongodump', [`--uri=${mongoUrl}`, `--out=${snapshotDir}`]);

  logger.info(`DB backup completed: ${snapshotName}`);
  return res.status(201).json({ name: snapshotName, createdAt: new Date() });
}

/**
 * POST /api/v2/db-backups/:name/restore
 * Restore a backup snapshot using mongorestore.
 * This DROPS the existing database before restoring.
 */
export async function restore(req, res) {
  const { name } = req.params;

  // Basic input sanitization — prevent path traversal
  if (!name || /[/\\.]/.test(name)) {
    return res.status(400).json({ message: 'Invalid backup name' });
  }

  const snapshotDir = path.join(BACKUP_BASE_DIR, name);
  const exists = await fs.pathExists(snapshotDir);

  if (!exists) {
    return res.status(404).json({ message: 'Backup not found' });
  }

  const mongoUrl = getMongoUrl();

  logger.warn(`Starting DB restore from backup: ${name}`);

  await runCommand('mongorestore', [
    `--uri=${mongoUrl}`,
    '--drop',
    snapshotDir
  ]);

  logger.warn(`DB restore completed from backup: ${name}`);
  return res.json({ message: 'Restore completed', name });
}

/**
 * DELETE /api/v2/db-backups/:name
 * Delete a backup snapshot.
 */
export async function remove(req, res) {
  const { name } = req.params;

  if (!name || /[/\\.]/.test(name)) {
    return res.status(400).json({ message: 'Invalid backup name' });
  }

  const snapshotDir = path.join(BACKUP_BASE_DIR, name);
  const exists = await fs.pathExists(snapshotDir);

  if (!exists) {
    return res.status(404).json({ message: 'Backup not found' });
  }

  await fs.remove(snapshotDir);
  return res.sendStatus(204);
}
