import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const _dataDir = path.join(__dirname, 'emailparts', 'data');

export async function build(templateName, recordId, params) {
  const dataPackagePath = path.join(_dataDir, templateName, 'index.js');

  if (!fs.existsSync(dataPackagePath)) {
    return {};
  }

  const data = await import(dataPackagePath);
  return await data.get(recordId, params);
}
