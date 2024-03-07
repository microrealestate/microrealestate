import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const _attachmentsDir = path.join(__dirname, 'emailparts', 'attachments');

export async function build(
  authorizationHeader,
  locale,
  organizationId,
  templateName,
  recordId,
  params,
  data
)  {
  const attachmentsPackagePath = path.join(
    _attachmentsDir,
    templateName,
    'index.js'
  );
  if (!fs.existsSync(attachmentsPackagePath)) {
    return {
      attachment: [],
    };
  }

  const attachments = await import(attachmentsPackagePath);
  return await attachments.get(
    authorizationHeader,
    locale,
    organizationId,
    recordId,
    params,
    data
  );
}
