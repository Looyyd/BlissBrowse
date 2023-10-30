import { testSpec, expect } from '../fixtures';

testSpec.describe('Popup Tests', () => {
  // The setup that will be done before each test in this describe block
  testSpec.beforeEach(async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/dist/popup.html`);
  });

  testSpec('popup page open option button', async ({ page, extensionId, context }) => {
    await expect(page.locator('#openOptionsButton')).toHaveText('Open Options');
    const currentPages = context.pages();
    await page.locator('#openOptionsButton').click();//TODO: sometimes this breaks, maybe need small delay
    // Wait for a new tab to open
    await context.waitForEvent('page', { timeout: 5000 });
    // Get all pages/tabs again and find the new one
    const allPages = context.pages();
    const newPage = allPages.find(p => !currentPages.includes(p));
    if (!newPage) throw new Error('No new page found');
    const newPageURL = newPage.url();
    expect(newPageURL.endsWith('/options.html')).toBe(true);
  });

  testSpec('popup add list', async ({ page, extensionId, context }) => {
    // Ensure the input field is present
    const inputField = page.locator('#listNameInputField');
    await expect(inputField).toBeVisible();

    // Enter a new list name to the input field
    const newListName = "My New List";
    await inputField.fill(newListName);

    // Click on the #newListSubmit button to submit the new list
    await page.locator('#newListSubmit').click();

    // Wait for potential animations, network requests, or DOM updates
    await page.waitForTimeout(1000);  // Adjust this timeout as needed

    // Check if listsList contains the added list
    const listsList = page.locator('#listsList');  // Assuming `#listsList` is the container for your lists
    const listItem = listsList.locator(`text=${newListName}`);
    await expect(listItem).toBeVisible();
  });

  testSpec('popup edit list', async ({ page, extensionId, context }) => {
    // Assuming listName was the name of the list added in the previous test
    const listName = "list2";

    // Recreate the setup: add the list first
    await page.locator('#listNameInputField').fill(listName);
    await page.locator('#newListSubmit').click();
    await page.waitForTimeout(1000);  // Adjust this timeout as needed

    // Select the edit button of id "edit-" + listName
    const editButton = page.locator(`#edit-${listName}`);

    await expect(editButton).toBeVisible();
    await editButton.click();

    // Wait for the new tab to open
    const currentPages = context.pages();
    await context.waitForEvent('page', { timeout: 5000 });
    const allPages = context.pages();
    const newTab = allPages.find(p => !currentPages.includes(p));
    if (!newTab) throw new Error('No new tab found');

    // Switch context to the new tab
    await newTab.bringToFront();

    // Check that the select of id customWordListSelect has text listName
    const selectOption = newTab.locator('#customWordListSelect').locator(`text=${listName}`);
    await expect(selectOption).toBeVisible();
  });



});