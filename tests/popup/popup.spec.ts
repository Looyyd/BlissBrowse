import { testSpec, expect } from '../fixtures';

testSpec('popup page open option button', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/dist/popup.html`);
  await expect(page.locator('#openOptionsButton')).toHaveText('Open Options');
});
