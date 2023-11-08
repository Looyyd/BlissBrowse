import {expect, testSpec} from '../fixtures';
import {addListWithPopup, addWordWithPopup, getNewTabAfterAction, getNewTabPromise} from "../testHelpers";

testSpec.describe('Statistics Tests', () => {
  // The setup that will be done before each test in this describe block
    testSpec('Count 1 statistics', async ({ page, extensionId, context }) => {

      await page.goto(`chrome-extension://${extensionId}/popup.html`);
      await addListWithPopup("list1", page);
      await addWordWithPopup(page, "list1", "trigger");
      const url = "file://" +__dirname + "/../content/pages/columns.html";
      //open test page
      await page.goto(url);
      //delay 1 second to allow page to load
      await page.waitForTimeout(1000);
      //check that count is right
      await page.goto(`chrome-extension://${extensionId}/options.html`);

      const cell = page.getByRole('cell', { name: '1' })
      await expect(cell).toBeVisible();
    });


});
