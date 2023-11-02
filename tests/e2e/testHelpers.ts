import {BrowserContext, Page} from "@playwright/test";
import {expect} from "./fixtures";

export async function addListWithPopup(listName: string, page: any) {
  // Enter a new list name to the input field
  const newListName = listName;
  const inputField = page.locator('#listNameInputField');

  await inputField.fill(newListName);

  // Click on the #newListSubmit button to submit the new list
  await page.locator('#newListSubmit').click();

  // Wait for potential animations, network requests, or DOM updates
  await page.waitForTimeout(1000);  // Adjust this timeout as needed
}

export async function getNewTabPromise(context: BrowserContext): Promise<Page> {
  // Get the current pages
  const currentPages = context.pages();

  // Create a promise that resolves when a new page is opened
  const waitForNewPagePromise = context.waitForEvent('page', {timeout: 5000});

  // Wait for the new page event to fire
  await waitForNewPagePromise;

  // Find the new page
  const allPages = context.pages();
  const newTab = allPages.find(p => !currentPages.includes(p));
  if (!newTab) throw new Error('No new tab found');

  return newTab;
}

export async function getNewTabAfterAction(context: BrowserContext, action: () => Promise<void>): Promise<Page> {
    const newTabPromise = getNewTabPromise(context);
    await action();
    const newTab = await newTabPromise;
    return newTab;
}


export async function addWordWithPopup(page: Page, listName: string, word: string) {
        //create new word
      const inputField = page.locator('#addWordTextInput');
      await expect(inputField).toBeVisible();
      const wordToAdd = word;
      await inputField.fill(wordToAdd);
      //await page.locator('#customWordListSelect').selectOption(listName);
      // Click the MUI select dropdown to open the options
      await page.locator('#customWordListSelect').click();

      // Wait a moment for the dropdown animation (might need to adjust timeout based on your application's behavior)
      await page.waitForTimeout(500);

      // Choose an option from the dropdown by its text content. For example, to select "list1":
      await page.locator('li[role="option"]:text("'+ listName +'")').click();
      //await page.locator('text="list1"').click();

      await page.locator('#submitNewWordButton').click();
      await page.waitForTimeout(1000);  // Adjust this timeout as needed
}