import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root_dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export const DATA_DIRECTORY = path.join(root_dir, 'data');
export const TEMPLATES_DIRECTORY = path.join(root_dir, 'templates');
export const TEMPORARY_DIRECTORY = path.join(root_dir, 'tmp');
export const PDF_DIRECTORY = path.join(root_dir, 'pdf_documents');
