import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root_dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export const TEMPORARY_DIRECTORY = path.join(root_dir, 'tmp');
