import {expect, testSpec} from "../fixtures";
import {addListWithPopup, addWordWithPopup} from "../testHelpers";
import {Locator, Page} from "@playwright/test";

export interface SiteConfig {
  name: string;
  url: string;
  locators_to_check_filtered: ((page: Page) => Locator)[];
  locators_to_check_not_filtered: ((page: Page) => Locator)[];
  words_to_filter: string[];
}

async function hasAttributeInHierarchy(locator: Locator, attribute: string, value: string): Promise<boolean> {
  let currentLocator = locator;
  while (true) {
    const attrValue = await currentLocator.getAttribute(attribute);
    if (attrValue === value) {
      return true;
    }

    const parentLocator = currentLocator.locator('..');
    const parentElementCount = await parentLocator.count();

    if (parentElementCount === 0) {
      // We've reached the root of the document or a shadow root
      break;
    }
    currentLocator = parentLocator;
  }
  return false;
}

export function testSite(siteConfig: SiteConfig){
  const listname = "list1";

  testSpec.describe('Content tests ' + siteConfig.name, () => {
    testSpec.beforeEach(async ({page, extensionId}) => {
      //go to popup page
      await page.goto(`chrome-extension://${extensionId}/dist/popup.html`);

      //TODO: probably want a more efficient way to add words to filter
      await addListWithPopup(listname, page);
      for (const word of siteConfig.words_to_filter) {
        await addWordWithPopup(page, listname, word);
      }
      await page.goto(siteConfig.url);
    });

    testSpec('words are filtered' + siteConfig.name, async ({page, extensionId, context}) => {

      const ATTRIBUTE_FILTER = "applied-action";
      const ATTRIBUTE_VALUE = "blur";
      await page.waitForTimeout(1000);//TODO: better way to indicate page has been processed,
                                                // maybe some kind of event done by content script
      for (const locatorFunction of siteConfig.locators_to_check_filtered) {
        const locator = locatorFunction(page);

        expect(locator).not.toBe(null);

        const hasAttribute = await locator.getAttribute(ATTRIBUTE_FILTER);
        const parentHasAttribute = await hasAttributeInHierarchy(locator, ATTRIBUTE_FILTER, ATTRIBUTE_VALUE);

        expect(hasAttribute === ATTRIBUTE_VALUE || parentHasAttribute).toBe(true);
      }
    });

    testSpec('words are not filtered' + siteConfig.name, async ({page, extensionId, context}) => {

      const ATTRIBUTE_FILTER = "applied-action";
      const ATTRIBUTE_VALUE = "blur";
      await page.waitForTimeout(1000);//TODO: better way to indicate page has been processed,
                                                // maybe some kind of event done by content script
      for (const locatorFunction of siteConfig.locators_to_check_not_filtered) {
        const locator = locatorFunction(page);

        expect(locator).not.toBe(null);

        const hasAttribute = await locator.getAttribute(ATTRIBUTE_FILTER);
        const parentHasAttribute = await hasAttributeInHierarchy(locator, ATTRIBUTE_FILTER, ATTRIBUTE_VALUE);

        expect(hasAttribute === ATTRIBUTE_VALUE || parentHasAttribute).toBe(false);
      }
    });
  });
}