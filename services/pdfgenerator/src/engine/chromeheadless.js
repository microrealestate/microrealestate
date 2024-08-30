import { logger, Service } from '@microrealestate/common';
import fileUrl from 'file-url';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const args = [
  '--allow-pre-commit-input',
  '--autoplay-policy=user-gesture-required',
  '--block-new-web-contents',
  '--disable-features=IsolateOrigins',
  '--disable-site-isolation-trials',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad',
  '--disable-client-side-phishing-detection',
  '--disable-component-extensions-with-background-pages',
  '--disable-component-update',
  '--disable-crash-reporter',
  '--disable-crashpad-forwarding',
  '--disable-default-apps',
  '--disable-dev-shm-usage',
  '--disable-domain-reliability',
  '--disable-extensions',
  '--disable-features=AudioServiceOutOfProcess',
  '--disable-features=AutofillServerCommunication',
  '--disable-features=InterestFeedContentSuggestions',
  '--disable-features=Translate',
  '--disable-features=CalculateNativeWinOcclusion',
  '--disable-features=CertificateTransparencyComponentUpdater',
  '--disable-features=DestroyProfileOnBrowserClose',
  '--disable-features=MediaRouter',
  '--disable-features=PaintHolding',
  '--disable-features=site-per-process',
  '--disable-hang-monitor',
  '--disable-ipc-flooding-protection',
  '--disable-notifications',
  '--disable-offer-store-unmasked-wallet-cards',
  '--disable-partial-raster',
  '--disable-popup-blocking',
  '--disable-print-preview',
  '--disable-prompt-on-repost',
  '--disable-renderer-backgrounding',
  '--disable-setuid-sandbox',
  '--disable-skia-runtime-opts',
  '--disable-software-rasterizer',
  '--disable-speech-api',
  '--disable-sync',
  '--enable-automation',
  '--enable-low-end-device-mode',
  '--hide-scrollbars',
  '--ignore-gpu-blacklist',
  '--metrics-recording-only',
  '--mute-audio',
  '--no-default-browser-check',
  '--no-first-run',
  '--no-pings',
  '--no-sandbox',
  '--no-service-autorun',
  '--no-zygote',
  '--password-store=basic',
  '--use-gl=swiftshader',
  '--use-mock-keychain'
];

export async function generate(documentId, html, fileName) {
  const { CHROMIUM_BIN, TEMPORARY_DIRECTORY, PDF_DIRECTORY } =
    Service.getInstance().envConfig.getValues();
  const html_file = path.join(TEMPORARY_DIRECTORY, `${fileName}.html`);
  const pdf_file = path.join(PDF_DIRECTORY, `${fileName}.pdf`);

  logger.debug(`generating pdf for ${documentId}...`);
  fs.writeFileSync(html_file, html, 'utf8');

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROMIUM_BIN || null,
      headless: true,
      userDataDir: path.join(TEMPORARY_DIRECTORY, 'chromium-data'),
      args,
    });

    const page = await browser.newPage();
    await page.goto(fileUrl(html_file));
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true
    });
    fs.writeFileSync(pdf_file, buffer);
    logger.debug(`done ${pdf_file}`);
    await page.close();
  } catch(error) {
    logger.error('chromium error', error);
  } finally {
    if (browser) {
      await browser.close();
      await browser.process()?.kill(9);
    }
  }
  return pdf_file;
}
