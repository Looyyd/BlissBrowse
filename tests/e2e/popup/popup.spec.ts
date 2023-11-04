import {expect, testSpec} from '../fixtures';
import {addListWithPopup, addWordWithPopup, getNewTabAfterAction, getNewTabPromise} from "../testHelpers";

testSpec.describe('Popup Tests', () => {
  // The setup that will be done before each test in this describe block
  testSpec.beforeEach(async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/dist/popup.html`);
  });

  testSpec('popup page open option button', async ({ page, extensionId, context }) => {
    await expect(page.locator('#openOptionsButton')).toHaveText('Open Options');
    const currentPages = context.pages();
    await page.waitForTimeout(500);//small delay because option button was breaking test

    const optionButton = page.locator('#openOptionsButton');
    const newTab = await getNewTabAfterAction(context, () => optionButton.click());

    const newPageURL = newTab.url();
    expect(newPageURL.endsWith('/options.html')).toBe(true);
  });

  testSpec('popup add list', async ({ page, extensionId, context }) => {
    const newListName = "list1";
    await addListWithPopup(newListName, page);

    // Check if listsList contains the added list
    const listsList = page.locator('#listsList');  // Assuming `#listsList` is the container for your lists
    const listItem = listsList.locator(`text=${newListName}`);
    await expect(listItem).toBeVisible();
  });

  testSpec('popup edit list', async ({ page, extensionId, context }) => {
    const listName = "list1";
    await addListWithPopup(listName, page);

    // Select the edit button of id "edit-" + listName
    const editButton = page.locator(`#edit-${listName}`);

    await expect(editButton).toBeVisible();

    const newTab = await getNewTabAfterAction(context, () => editButton.click());

    // Switch context to the new tab
    await newTab.bringToFront();

    // Check that the select of id customWordListSelect has text listName
    const selectOption = newTab.locator('#customWordListSelect').locator(`text=${listName}`);
    await expect(selectOption).toBeVisible();
  });

    testSpec('popup add word', async ({ page, extensionId, context }) => {
      const listName = "list1";
      const wordToAdd = "SampleWord";
      await addListWithPopup(listName, page);

      //create new word
      await addWordWithPopup(page, listName, wordToAdd);

      const editButton = page.locator(`#edit-${listName}`);
      const newTab = await getNewTabAfterAction(context, () => editButton.click());

      // Switch context to the new tab
      await newTab.bringToFront();

      // Check that the word appears in the text box with ID filterWordlistsEditorTextArea
      //small delay because lists needs to load
      await newTab.waitForTimeout(1000);//TODO: shorter timeout
      const textAreaContent = await newTab.locator('#filterWordlistsEditorTextArea').inputValue();
      //TODO: we should keep casing consistent, withouth lowercasing everything
      expect(textAreaContent.includes(wordToAdd.toLowerCase())).toBe(true);
    });

});