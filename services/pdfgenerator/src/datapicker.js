import path from 'path';
// eslint-disable-next-line import/no-unresolved
import { Service } from '@microrealestate/common';

export default async function (templateId, params) {
  const { DATA_DIRECTORY } = Service.getInstance().envConfig.getValues();
  const data = await import(path.join(DATA_DIRECTORY, templateId, 'index.js'));
  return await data.get(params);
}
