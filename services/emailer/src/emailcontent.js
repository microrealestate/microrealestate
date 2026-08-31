import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Service } from '@microrealestate/common';
import ejs from 'ejs';
import templateFunctions from './utils/templatefunctions';

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
  _recordId,
  _params,
  emailData
) {
  const contentPackagePath = path.join(_templatesDir, templateName);

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
