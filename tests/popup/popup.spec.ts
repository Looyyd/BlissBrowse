import { testSpec, expect } from '../fixtures';
import {BrowserContext} from "@playwright/test";

async function addList(listName: string, page: any) {
  // Enter a new list name to the input field
  const newListName = listName;
  const inputField = page.locator('#listNameInputField');

  await inputField.fill(newListName);

  // Click on the #newListSubmit button to submit the new list
  await page.locator('#newListSubmit').click();

  // Wait for potential animations, network requests, or DOM updates
  await page.waitForTimeout(1000);  // Adjust this timeout as needed
}

async function waitNewTab(context: BrowserContext) {
  // Wait for the new tab to open
  const currentPages = context.pages();
  await context.waitForEvent('page', { timeout: 5000 });
  const allPages = context.pages();
  const newTab = allPages.find(p => !currentPages.includes(p));
  if (!newTab) throw new Error('No new tab found');
  return newTab;
}

testSpec.describe('Popup Tests', () => {
  // The setup that will be done before each test in this describe block
  testSpec.beforeEach(async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/dist/popup.html`);
  });

  testSpec('popup page open option button', async ({ page, extensionId, context }) => {
    await expect(page.locator('#openOptionsButton')).toHaveText('Open Options');
    const currentPages = context.pages();
    await page.waitForTimeout(500);//small delay because option button was breaking test
    await page.locator('#openOptionsButton').click();

    const newTab = await waitNewTab(context);
    const newPageURL = newTab.url();
    expect(newPageURL.endsWith('/options.html')).toBe(true);
  });

  testSpec('popup add list', async ({ page, extensionId, context }) => {
    const newListName = "list1";
    await addList(newListName, page);

    // Check if listsList contains the added list
    const listsList = page.locator('#listsList');  // Assuming `#listsList` is the container for your lists
    const listItem = listsList.locator(`text=${newListName}`);
    await expect(listItem).toBeVisible();
  });

  testSpec('popup edit list', async ({ page, extensionId, context }) => {
    const listName = "list1";
    await addList(listName, page);

    // Select the edit button of id "edit-" + listName
    const editButton = page.locator(`#edit-${listName}`);

    await expect(editButton).toBeVisible();
    await editButton.click();

    const newTab = await waitNewTab(context);
    // Switch context to the new tab
    await newTab.bringToFront();

    // Check that the select of id customWordListSelect has text listName
    const selectOption = newTab.locator('#customWordListSelect').locator(`text=${listName}`);
    await expect(selectOption).toBeVisible();
  });

    testSpec('popup add word', async ({ page, extensionId, context }) => {
      const listName = "list1";
      await addList(listName, page);

      //create new word
      const inputField = page.locator('#addWordTextInput');
      await expect(inputField).toBeVisible();
      const wordToAdd = "SampleWord";
      await inputField.fill(wordToAdd);
      //await page.locator('#customWordListSelect').selectOption(listName);
      // Click the MUI select dropdown to open the options
      await page.locator('#customWordListSelect').click();

      // Wait a moment for the dropdown animation (might need to adjust timeout based on your application's behavior)
      await page.waitForTimeout(500);

      // Choose an option from the dropdown by its text content. For example, to select "list1":
      await page.locator('li[role="option"]:text("list1")').click();
      //await page.locator('text="list1"').click();

      await page.locator('#submitNewWordButton').click();
      await page.waitForTimeout(1000);  // Adjust this timeout as needed

      await page.locator(`#edit-${listName}`).click();

      const newTab = await waitNewTab(context);
      // Switch context to the new tab
      await newTab.bringToFront();

      // Check that the word appears in the text box with ID filterWordlistsEditorTextArea
      //small delay because lists needs to load
      await newTab.waitForTimeout(500);
      const textAreaContent = await newTab.locator('#filterWordlistsEditorTextArea').inputValue();
      console.log("textAreacContent", textAreaContent);
      expect(textAreaContent.includes(wordToAdd)).toBe(true);
    });

});