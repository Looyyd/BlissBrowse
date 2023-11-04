import {expect, testSpec} from "../fixtures";
import {addListWithPopup, addWordWithPopup} from "../testHelpers";
import {Locator, Page} from "@playwright/test";
import {EXTENSION_NAME} from "../../../src/constants";

export interface SiteConfig {
  name: string;
  url: string;
  locators_to_check_filtered: ((page: Page) => Locator)[];
  locators_to_check_not_filtered: ((page: Page) => Locator)[];
  words_to_filter: string[];
  setup_actions?: ((page: Page) => Promise<void>);
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

export function selectLocatorHelper(siteConfig: SiteConfig){
  testSpec("select locator helper " + siteConfig.name, async ({page, extensionId, context}) => {
      await page.goto(siteConfig.url);
      await siteConfig.setup_actions?.(page);
      await page.pause();
  });
}

export function testSite(siteConfig: SiteConfig, fullTest: boolean = false) {
  const listname = "list1";
  const ATTRIBUTE_FILTER = "applied-action";
  const ATTRIBUTE_VALUE = "blur";

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
      await siteConfig.setup_actions?.(page);
      await page.waitForTimeout(1000);//TODO: better way to indicate page has been processed,
      // maybe some kind of event done by content script
    });

    testSpec('words are filtered ' + siteConfig.name, async ({page, extensionId, context}) => {

      for (const locatorFunction of siteConfig.locators_to_check_filtered) {
        const locator = locatorFunction(page);

        expect(locator).not.toBe(null);

        const hasAttribute = await locator.getAttribute(ATTRIBUTE_FILTER);
        const parentHasAttribute = await hasAttributeInHierarchy(locator, ATTRIBUTE_FILTER, ATTRIBUTE_VALUE);

        expect(hasAttribute === ATTRIBUTE_VALUE || parentHasAttribute).toBe(true);
      }
    });

    testSpec('words are not filtered ' + siteConfig.name, async ({page, extensionId, context}) => {
      for (const locatorFunction of siteConfig.locators_to_check_not_filtered) {
        const locator = locatorFunction(page);

        expect(locator).not.toBe(null);

        const hasAttribute = await locator.getAttribute(ATTRIBUTE_FILTER);
        const parentHasAttribute = await hasAttributeInHierarchy(locator, ATTRIBUTE_FILTER, ATTRIBUTE_VALUE);

        expect(hasAttribute === ATTRIBUTE_VALUE || parentHasAttribute).toBe(false);
      }
    });


    testSpec("word unfiltered after disabled on site " + siteConfig.name, async ({page, extensionId, context}) => {
      await page.goto(`chrome-extension://${extensionId}/dist/options.html`);
      await page.click("#Blacklisted_WebsitesTab");
      const hostname = new URL(siteConfig.url).hostname;
      await page.fill("#hostnameBlacklistEditorTextArea", hostname);
      await page.click("#hostname-save");

      await page.goto(siteConfig.url);
      await page.waitForTimeout(1000);
      for (const locatorFunction of siteConfig.locators_to_check_filtered) {
        const locator = locatorFunction(page);
        expect(locator).not.toBe(null);

        const hasAttribute = await locator.getAttribute(ATTRIBUTE_FILTER);
        const parentHasAttribute = await hasAttributeInHierarchy(locator, ATTRIBUTE_FILTER, ATTRIBUTE_VALUE);

        expect(hasAttribute === ATTRIBUTE_VALUE || parentHasAttribute).toBe(false);
      }
    });

    if(fullTest) {
      testSpec("unfilter and refilter button works " + siteConfig.name, async ({page, extensionId, context}) => {
        const locator = siteConfig.locators_to_check_filtered[0](page);
        expect(locator).not.toBe(null);
        //hover over element
        await locator.hover();
        //click unfilter button
        await page.click("#unfilterAndIgnoreElementButton");
        //check that element is not filtered
        const hasAttribute = await locator.getAttribute(ATTRIBUTE_FILTER);
        const parentHasAttribute = await hasAttributeInHierarchy(locator, ATTRIBUTE_FILTER, ATTRIBUTE_VALUE);
        expect(hasAttribute === ATTRIBUTE_VALUE || parentHasAttribute).toBe(false);
        //click refilter button
        await locator.hover();
        await page.click("#refilterElementButton");
        //check that element is filtered
        const hasAttribute2 = await locator.getAttribute(ATTRIBUTE_FILTER);
        const parentHasAttribute2 = await hasAttributeInHierarchy(locator, ATTRIBUTE_FILTER, ATTRIBUTE_VALUE);
        expect(hasAttribute2 === ATTRIBUTE_VALUE || parentHasAttribute2).toBe(true);
      });
    }
    if(fullTest){
      testSpec("unfilter tooltip logo works " + siteConfig.name, async ({page, extensionId, context}) => {
        const locator = siteConfig.locators_to_check_filtered[0](page);
        expect(locator).not.toBe(null);
        //hover over element
        await locator.hover();
        // get EXTENSION_NAME+"logo" element
        const logo = await page.$("#" + EXTENSION_NAME+"logo");
        expect(logo).not.toBe(null);
      });
    }
  });
}