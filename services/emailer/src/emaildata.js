import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const _dataDir = path.join(__dirname, 'emailparts', 'data');

export async function build(templateName, recordId, params) {
  const dataPackagePath = path.join(
    _dataDir,
    templateName,
    'index.js'
  );

  if (!fs.existsSync(dataPackagePath)) {
    return {};
  }

  const data = await import(dataPackagePath);
  return await data.get(recordId, params);
};