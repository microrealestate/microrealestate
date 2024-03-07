import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function build(locale, templateName, recordId, params, data) {
  const recipientsPackagePath = path.join(
    __dirname,
    'emailparts',
    'recipients',
    templateName,
    'index.js'
  );
  if (!fs.existsSync(recipientsPackagePath)) {
    return [];
  }

  const recipients = await import(recipientsPackagePath);
  return await recipients.get(recordId, params, data);
};
