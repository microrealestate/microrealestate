import * as PdfEngine from './engine/chromeheadless.js';
import dataPicker from './datapicker.js';
import ejs from 'ejs';
import fs from 'fs';
import logger from 'winston';
import path from 'path';
// eslint-disable-next-line import/no-unresolved
import { Service } from '@microrealestate/common';
import templateFunctions from './utils/templatefunctions.js';

const settings = {
  'view engine': ejs.renderFile,
  'pdf engine': PdfEngine
};

export function set(key, value) {
  settings[key] = value;
}

export async function start() {
  const { TEMPORARY_DIRECTORY, PDF_DIRECTORY } =
    Service.getInstance().envConfig.getValues();

  if (!fs.existsSync(PDF_DIRECTORY)) {
    fs.mkdirSync(PDF_DIRECTORY);
  }
  if (!fs.existsSync(TEMPORARY_DIRECTORY)) {
    fs.mkdirSync(TEMPORARY_DIRECTORY);
  }

  await settings['pdf engine'].start();
}

export async function exit() {
  await settings['pdf engine'].exit();
}

export async function generate(documentId, params) {
  const { TEMPLATES_DIRECTORY } = Service.getInstance().envConfig.getValues();

  const templateFile = path.join(TEMPLATES_DIRECTORY, `${documentId}.ejs`);
  if (!fs.existsSync(templateFile)) {
    logger.error(
      `cannot generate file for a not existing template ${templateFile}`
    );
    throw new Error(
      `cannot generate file for a not existing template ${templateFile}`
    );
  }

  const data = await dataPicker(documentId, params);
  const html = await settings['view engine'](
    templateFile,
    {
      ...data,
      _: templateFunctions({
        locale: data.landlord.locale,
        currency: data.landlord.currency
      })
    },
    { root: TEMPLATES_DIRECTORY }
  );
  return await settings['pdf engine'].generate(documentId, html, data.fileName);
}
