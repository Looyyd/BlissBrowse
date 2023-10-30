import path from 'path';
import { chromium, test } from '@playwright/test';

const fixtures = test.extend({
  context: async ({ }, use) => {
    const pathToExtension = path.join(__dirname, '../');
    const context = await chromium.launchPersistentContext('', {
      headless: true,
      args: [
        `--headless=new`,
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },

  backgroundWorker: async ({ context }, use) => {
    let serviceWorker = context.serviceWorkers()[0];
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    await use(serviceWorker);
  },

  extensionId: async ({ backgroundWorker }, use) => {
    const extensionId = backgroundWorker.url().split('/')[2];
    await use(extensionId);
  },
});

export const testSpec = fixtures;
export const expect = fixtures.expect;
