import fs from 'node:fs';
import path from 'node:path';
import { formatError, logger, Service } from '@microrealestate/common';
import fileUrl from 'file-url';
import puppeteer from 'puppeteer';
import { PDF_DIRECTORY, TEMPORARY_DIRECTORY } from '../directories';

const BROWSER = {
  INSTANCE: null,
  SHUTTING_DOWN: false,
  ARGS: [
    '--allow-pre-commit-input',
    '--autoplay-policy=user-gesture-required',
    '--block-new-web-contents',
    '--disable-features=IsolateOrigins,site-per-process,AudioServiceOutOfProcess,AutofillServerCommunication,InterestFeedContentSuggestions,Translate,CalculateNativeWinOcclusion,CertificateTransparencyComponentUpdater,DestroyProfileOnBrowserClose,MediaRouter,PaintHolding',
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
    '--use-mock-keychain'
  ]
};

export async function start() {
  const { CHROMIUM_BIN } = Service.getInstance().envConfig.getValues();
  try {
    BROWSER.INSTANCE = await puppeteer.launch({
      executablePath: CHROMIUM_BIN || null,
      headless: true,
      // The service owns shutdown (see Service SIGINT/SIGTERM handlers and
      // exit() below). Let puppeteer's own signal handlers close the browser
      // and it races our shutdown, firing 'disconnected' -> relaunch.
      handleSIGINT: false,
      handleSIGTERM: false,
      handleSIGHUP: false,
      args: BROWSER.ARGS
    });
    BROWSER.INSTANCE.on('error', (error) =>
      logger.error('chromium error', error)
    );
    BROWSER.INSTANCE.on('disconnected', async () => {
      logger.warn('chromium has been disconnected');
      BROWSER.INSTANCE = null;
      // Don't resurrect chromium while the service is shutting down,
      // otherwise the new browser keeps the event loop alive and the
      // process never exits (blocks SIGTERM restarts and docker stop).
      if (BROWSER.SHUTTING_DOWN) {
        return;
      }
      try {
        await start();
      } catch (error) {
        logger.error('chromium relaunch failed', error);
      }
    });
  } catch (error) {
    BROWSER.INSTANCE = null;
    logger.error('something went wrong when starting chromium', error);
    throw error;
  }
}

export async function exit() {
  BROWSER.SHUTTING_DOWN = true;
  // Capture before close(): the 'disconnected' handler nulls BROWSER.INSTANCE
  // as soon as close() tears the browser down.
  const instance = BROWSER.INSTANCE;
  BROWSER.INSTANCE = null;
  if (!instance) {
    return;
  }
  try {
    const browserProcess = instance.process();
    await instance.close();
    browserProcess?.kill(9);
  } catch (error) {
    logger.error(formatError(error));
  }
}

export async function generate(_documentId, html, fileName) {
  if (!BROWSER.INSTANCE || !BROWSER.INSTANCE.connected) {
    throw new Error('chromium has not been started or is disconnected');
  }

  const html_file = path.join(TEMPORARY_DIRECTORY, `${fileName}.html`);
  const page = await BROWSER.INSTANCE.newPage();
  try {
    page.on('error', (error) => {
      logger.error('chromium page error', error);
    });

    const pdf_file = path.join(PDF_DIRECTORY, `${fileName}.pdf`);

    logger.debug('writing the html file on disk');
    fs.writeFileSync(html_file, html, 'utf8');
    logger.debug('write html done');

    const pageUrl = fileUrl(html_file);
    await page.goto(pageUrl);

    logger.debug('chromium started generating a pdf');
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true
    });
    fs.writeFileSync(pdf_file, buffer);
    logger.debug('chromium has generated the pdf');

    return pdf_file;
  } finally {
    await page.close().catch(() => {});
    try {
      fs.rmSync(html_file, { force: true });
    } catch (error) {
      logger.error(formatError(error));
    }
  }
}
