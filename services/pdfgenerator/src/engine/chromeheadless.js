import { logger, Service } from '@microrealestate/common';
import fileUrl from 'file-url';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const BROWSER = {
  INSTANCE: null,
  ARGS: [
    '--allow-pre-commit-input',
    '--autoplay-policy=user-gesture-required',
    '--block-new-web-contents',
    '--disable-features=IsolateOrigins',
    '--disable-accelerated-2d-canvas',
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
    '--disable-gpu',
    '--disable-hang-monitor',
    '--disable-ipc-flooding-protection',
    '--disable-notifications',
    '--disable-offer-store-unmasked-wallet-cards',
    '--disable-partial-raster',
    '--disable-popup-blocking',
    '--disable-print-preview',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-session-crashed-bubble',
    '--disable-setuid-sandbox',
    '--disable-site-isolation-trials',
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
    '--noerrdialogs',
    '--password-store=basic',
    //'--single-process',  --> crash browser if activated
    '--use-gl=swiftshader',
    '--use-mock-keychain'
  ]
};

export async function start() {
  const { CHROMIUM_BIN } = Service.getInstance().envConfig.getValues();
  try {
    BROWSER.INSTANCE = await puppeteer.launch({
      executablePath: CHROMIUM_BIN || null,
      headless: true,
      args: BROWSER.ARGS
    });
    BROWSER.INSTANCE.on('error', (error) =>
      logger.error('chromium error:', error)
    );
    BROWSER.INSTANCE.on('disconnected', () =>
      logger.warn('chromium has been disconnected')
    );
  } catch (error) {
    logger.error('something went wrong when starting chromium', error);
  }
}

export async function stop() {
  try {
    if (BROWSER.INSTANCE) {
      await BROWSER.INSTANCE.close();
      await BROWSER.INSTANCE.process()?.kill(9);
    }
  } catch (error) {
    logger.error(error);
  }
}

export async function generate(documentId, html, fileName) {
  if (!BROWSER.INSTANCE) {
    throw new Error('chromium has not been started');
  }

  const page = await BROWSER.INSTANCE.newPage();
  page.on('error', (error) => {
    logger.error('chromium page error', error);
  });

  const { TEMPORARY_DIRECTORY, PDF_DIRECTORY } =
    Service.getInstance().envConfig.getValues();
  const html_file = path.join(TEMPORARY_DIRECTORY, `${fileName}.html`);
  const pdf_file = path.join(PDF_DIRECTORY, `${fileName}.pdf`);

  logger.debug(`writing ${html_file} on disk`);
  fs.writeFileSync(html_file, html, 'utf8');
  logger.debug('write html done');

  const pageUrl = fileUrl(html_file);
  logger.debug(`chromium navigating to ${pageUrl}`);
  await page.goto(pageUrl);

  logger.debug(`chromium started generating pdf for ${pageUrl}`);
  const buffer = await page.pdf({
    format: 'A4',
    printBackground: true
  });
  fs.writeFileSync(pdf_file, buffer);
  logger.debug(`done ${pdf_file}`);

  await page.close();

  return pdf_file;
}
