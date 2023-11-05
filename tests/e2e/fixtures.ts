import path from 'path';
import { chromium, test } from '@playwright/test';

export const headless = true;

const fixtures = test.extend({
  context: async ({ }, use) => {
    const pathToExtension = path.join(__dirname, '../../dev');
    const args = [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ];
    if (headless) {
      args.push('--headless=new');
    }
    const context = await chromium.launchPersistentContext('', {
      headless: headless,
      args: args,
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
