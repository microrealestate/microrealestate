import fileUrl from 'file-url';
import fs from 'fs';
import logger from 'winston';
import path from 'path';
import puppeteer from 'puppeteer';
// eslint-disable-next-line import/no-unresolved
import { Service } from '@microrealestate/typed-common';

let browserWSEndpoint;

export async function start() {
  logger.debug('chrome headless starting...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.CHROMIUM_BIN || null,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  browserWSEndpoint = browser.wsEndpoint();
  await browser.disconnect();
  logger.debug(`chrome headless ready on endpoint: ${browserWSEndpoint}`);
}

export async function exit() {
  logger.debug('chrome headless stopping...');
  const browser = await puppeteer.connect({ browserWSEndpoint });
  if (browser) {
    await browser.close();
  }
  logger.debug('chrome headless stopped');
}

export async function generate(documentId, html, fileName) {
  const { TEMPORARY_DIRECTORY, PDF_DIRECTORY } = Service.getInstance().envConfig.getValues();
  const html_file = path.join(TEMPORARY_DIRECTORY, `${fileName}.html`);
  const pdf_file = path.join(PDF_DIRECTORY, `${fileName}.pdf`);

  logger.debug(`generating pdf for ${documentId}...`);
  fs.writeFileSync(html_file, html, 'utf8');

  const browser = await puppeteer.connect({ browserWSEndpoint });
  const page = await browser.newPage();
  await page.goto(fileUrl(html_file));
  const buffer = await page.pdf({
    format: 'A4',
    printBackground: true,
  });
  fs.writeFileSync(pdf_file, buffer);
  await page.close();
  logger.debug(`done ${pdf_file}`);

  return pdf_file;
}
