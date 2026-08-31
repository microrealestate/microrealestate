import path from 'node:path';
import { DATA_DIRECTORY } from './directories';

export default async function (templateId, params) {
  const data = await import(path.join(DATA_DIRECTORY, templateId, 'index.js'));
  return await data.get(params);
}
