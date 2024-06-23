import ejs from 'ejs';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
// eslint-disable-next-line import/no-unresolved
import { Service } from '@microrealestate/common';
import templateFunctions from './utils/templatefunctions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const _templatesDir = path.join(__dirname, 'emailparts', 'contents');

function _renderFile(templateFile, data) {
  return new Promise((resolve, reject) => {
    ejs.renderFile(templateFile, data, { root: _templatesDir }, (err, html) => {
      if (err) {
        return reject(err);
      }
      resolve(html);
    });
  });
}

export async function build(
  locale,
  currency,
  templateName,
  recordId,
  params,
  emailData
) {
  const contentPackagePath = path.join(_templatesDir, templateName, locale);

  if (!fs.existsSync(contentPackagePath)) {
    throw new Error(
      `cannot generate email content for ${templateName}. Template not found`
    );
  }

  const data = {
    ...emailData,
    config: Service.getInstance().envConfig.getValues(),
    _: templateFunctions({ locale, currency })
  };
  const subject = await _renderFile(
    path.join(contentPackagePath, 'subject.ejs'),
    data
  );
  const html = await _renderFile(
    path.join(contentPackagePath, 'body_html.ejs'),
    data
  );
  const text = await _renderFile(
    path.join(contentPackagePath, 'body_text.ejs'),
    data
  );
  return { subject, text, html };
}
