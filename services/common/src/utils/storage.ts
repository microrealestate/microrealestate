import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Readable } from 'node:stream';
import {
  canonicalMimeType,
  SUPPORTED_FILE_EXTENSIONS,
  SUPPORTED_MIMETYPES,
  UPLOAD_MAX_SIZE
} from '@microrealestate/shared';
import type { RequestHandler } from 'express';
import { fileTypeFromFile } from 'file-type';
import multer from 'multer';
import sanitizeFilename from 'sanitize-filename';
import logger, { formatError } from './logger';
import ServiceError from './serviceerror';

export function sanitize(name = '') {
  return sanitizeFilename(name, { replacement: '_' });
}

export function contentDispositionAttachment(name = '') {
  const safe = name || 'document';
  // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping C0 controls is intentional
  const ascii = safe.replace(/[\x00-\x1f"\\]/g, '');
  const encoded = encodeURIComponent(safe).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

// Move a file, falling back to copy+unlink when src and dest live on different
// filesystems (rename would throw EXDEV). rename overwrites dest atomically.
async function _moveFile(src: string, dest: string) {
  try {
    await fs.promises.rename(src, dest);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EXDEV') {
      throw error;
    }
    await fs.promises.copyFile(src, dest);
    await fs.promises.rm(src, { force: true });
  }
}

// Persists a staged upload to its final location under `uploadsDir` and owns the
// staged temp file's lifecycle.
export async function persistUpload({
  stagedPath,
  key,
  fileName,
  uploadsDir
}: {
  stagedPath: string;
  key: string;
  fileName: string;
  uploadsDir: string;
}): Promise<{ fileName: string; key: string }> {
  try {
    const dest = path.resolve(uploadsDir, key);
    await fs.promises.mkdir(path.dirname(dest), { recursive: true });
    await _moveFile(stagedPath, dest);
    return { fileName, key };
  } finally {
    // Guarantee the staged temp is gone on every path: failure and the EXDEV
    // fallback. On success it was already moved, so this rm is a no-op (force
    // ignores ENOENT).
    await fs.promises.rm(stagedPath, { force: true }).catch(() => {});
  }
}

// Removes stored document bytes for the given files from the local uploads
// directory (best-effort per file).
export async function deleteDocumentFiles(
  files: { url?: string }[],
  { uploadsDir }: { uploadsDir: string }
): Promise<void> {
  const fileList = files.filter((file): file is { url: string } => !!file.url);
  if (!fileList.length) {
    return;
  }

  await Promise.all(
    fileList.map(async ({ url }) => {
      const filePath = resolveWithinDir(uploadsDir, url);
      if (!filePath) {
        logger.error('document url attempts path traversal');
        return;
      }
      try {
        await fs.promises.rm(filePath, { force: true });
      } catch (error) {
        logger.error(`failed to remove local file ${url}`);
        logger.error(formatError(error as Error));
      }
    })
  );
}

// Resolve `relativePath` against `baseDir`, returning the absolute path only if
// it stays strictly inside `baseDir`; otherwise undefined. `path.relative` (not
// `startsWith`) rejects both `..` traversal and sibling dirs like `<baseDir>-x`
// that a bare prefix check would wrongly accept. Passing an already-absolute
// second arg is fine (path.resolve keeps it), so this also works as a boolean
// predicate on a pre-resolved path.
function resolveWithinDir(
  baseDir: string,
  relativePath: string
): string | undefined {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, relativePath);
  const rel = path.relative(base, target);
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
    return undefined;
  }
  return target;
}

// Resolves a readable stream for a stored document from the local uploads
// directory. Throws a 404 ServiceError when the document cannot be found.
export async function getDocumentStream(
  url: string,
  { uploadsDir }: { uploadsDir: string }
): Promise<Readable> {
  const filePath = resolveWithinDir(uploadsDir, url);
  if (!filePath) {
    logger.error('document url attempts path traversal');
    throw new ServiceError('missing fields', 422);
  }
  if (fs.existsSync(filePath)) {
    return fs.createReadStream(filePath);
  }

  throw new ServiceError('document not found', 404);
}

// Builds the storage key/filename for an uploaded document:
// "<orgName>-<orgId>/<folder>/<name>-<suffix>.<ext>".
export function buildStorageKey({
  realmName,
  realmId,
  folder,
  fileName,
  mimeType
}: {
  realmName: string;
  realmId: string;
  folder: string;
  fileName: string;
  mimeType: string;
}) {
  const extension = SUPPORTED_FILE_EXTENSIONS[mimeType];
  if (!extension) {
    throw new ServiceError('file not supported', 422);
  }
  const suffix = randomUUID();
  const safeName = sanitize(`${fileName || 'noname'}-${suffix}.${extension}`);
  const dir = [`${sanitize(realmName)}-${sanitize(realmId)}`]
    .concat(
      folder
        .split('/')
        .map((part) => sanitize(part))
        .filter(Boolean)
    )
    .join('/');
  return { key: `${dir}/${safeName}`, fileName: safeName };
}

async function _discardStagedFile(filePath: string) {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    logger.error(`could not remove staged file ${filePath}`);
    logger.error(formatError(error as Error));
  }
}

// Disk-staging multer middleware: writes the upload to a staging area under
// `uploadsDir` with a randomized, mimetype-validated filename. The caller then
// moves the staged file to its final local path. Bounded memory regardless of
// file size.
export function uploadMiddleware({
  uploadsDir,
  maxSize = UPLOAD_MAX_SIZE
}: {
  uploadsDir: string;
  maxSize?: number;
}): RequestHandler {
  const stagingDir = path.join(uploadsDir, '.staging');
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      try {
        fs.mkdirSync(stagingDir, { recursive: true });
        cb(null, stagingDir);
      } catch (error) {
        cb(error as Error, stagingDir);
      }
    },
    filename: (_req, file, cb) => {
      if (!SUPPORTED_MIMETYPES.includes(file.mimetype)) {
        return cb(new Error('file not supported'), '');
      }
      const extension = SUPPORTED_FILE_EXTENSIONS[file.mimetype];
      cb(null, sanitize(`upload-${randomUUID()}.${extension}`));
    }
  });

  // multer ships its own @types/express (v5); cast to a plain callable so the
  // middleware composes with the project's express v4 router.
  const upload = multer({
    storage,
    limits: { fileSize: maxSize },
    fileFilter: (_req, file, cb) => {
      if (!SUPPORTED_MIMETYPES.includes(file.mimetype)) {
        return cb(new Error('file not supported'));
      }
      cb(null, true);
    }
  }).single('file') as unknown as (
    req: unknown,
    res: unknown,
    cb: (err?: unknown) => void
  ) => void;

  const middleware: RequestHandler = (req, res, next) => {
    upload(req, res, async (err) => {
      if (err) {
        if ((err as { code?: string }).code === 'LIMIT_FILE_SIZE') {
          return next(new ServiceError('file too large', 413));
        }
        if ((err as Error).message === 'file not supported') {
          return next(new ServiceError('file not supported', 422));
        }
        logger.error(formatError(err as Error));
        return next(err);
      }

      const file = (req as { file?: { path: string; mimetype: string } }).file;
      if (!file) {
        return next();
      }
      try {
        const detected = await fileTypeFromFile(file.path);
        if (detected?.mime !== canonicalMimeType(file.mimetype)) {
          await _discardStagedFile(file.path);
          return next(new ServiceError('file not supported', 422));
        }
      } catch (error) {
        logger.error(formatError(error as Error));
        await _discardStagedFile(file.path);
        return next(new ServiceError('file not supported', 422));
      }
      next();
    });
  };
  return middleware;
}
