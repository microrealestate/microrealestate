import fs from 'node:fs';
import path from 'node:path';
import { formatError, logger } from '@microrealestate/common';
import { Mutex } from 'async-mutex';
import ejs from 'ejs';
import dataPicker from './datapicker';
import {
  PDF_DIRECTORY,
  TEMPLATES_DIRECTORY,
  TEMPORARY_DIRECTORY
} from './directories';
import * as PdfEngine from './engine/chromeheadless';
import templateFunctions from './utils/templatefunctions';

const mutex = new Mutex();

const settings = {
  'view engine': ejs.renderFile,
  'pdf engine': PdfEngine
};

export function set(key, value) {
  settings[key] = value;
}

export async function start() {
  if (!fs.existsSync(PDF_DIRECTORY)) {
    fs.mkdirSync(PDF_DIRECTORY);
  }
  if (!fs.existsSync(TEMPORARY_DIRECTORY)) {
    fs.mkdirSync(TEMPORARY_DIRECTORY);
  }
  await settings['pdf engine'].start();
}

export async function exit() {
  try {
    for (const entry of fs.readdirSync(TEMPORARY_DIRECTORY)) {
      fs.rmSync(path.join(TEMPORARY_DIRECTORY, entry), {
        recursive: true,
        force: true
      });
    }
  } catch (error) {
    logger.error(formatError(error));
  }
  await settings['pdf engine'].exit();
}

export async function generate(documentId, params) {
  const templateFile = path.join(TEMPLATES_DIRECTORY, `${documentId}.ejs`);
  if (!fs.existsSync(templateFile)) {
    logger.error(
      `cannot generate file for a not existing template ${templateFile}`
    );
    throw new Error(
      `cannot generate file for a not existing template ${templateFile}`
    );
  }

  return await mutex.runExclusive(async () => {
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

    return await settings['pdf engine'].generate(
      documentId,
      html,
      data.fileName
    );
  });
}
