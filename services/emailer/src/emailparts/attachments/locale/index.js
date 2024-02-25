import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function(locale) {
  const content = fs.readFileSync(path.join(__dirname, `${locale}.json`));
  return JSON.parse(content);
};
