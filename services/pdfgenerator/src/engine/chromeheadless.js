const logger = require('winston');
const path = require('path');
const fs = require('fs');
const fileUrl = require('file-url');
const puppeteer = require('puppeteer');
const config = require('../config');

const pdf_dir = config.PDF_DIRECTORY;
const tmp_dir = config.TEMPORARY_DIRECTORY;

let browserWSEndpoint;

async function start() {
  logger.debug('chrome headless starting...');
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_BIN || null,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  browserWSEndpoint = browser.wsEndpoint();
  await browser.disconnect();
  logger.debug(`chrome headless ready on endpoint: ${browserWSEndpoint}`);
}

async function exit() {
  logger.debug('chrome headless stopping...');
  const browser = await puppeteer.connect({ browserWSEndpoint });
  if (browser) {
    await browser.close();
  }
  logger.debug('chrome headless stopped');
}

async function generate(documentId, html, fileName) {
  const html_file = path.join(tmp_dir, `${fileName}.html`);
  const pdf_file = path.join(pdf_dir, `${fileName}.pdf`);

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

module.exports = {
  start,
  exit,
  generate,
};
