import { test, expect } from '@playwright/test';

const INIT_TIMEOUT = 60_000;

test.describe('Tab rename with contentEditable', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-index="0"]', { timeout: INIT_TIMEOUT });
  });

  test('double-click tab label enables editing and Enter commits', async ({ page }) => {
    // Find a dock tab label (e.g. "PnL & Volume")
    const tabLabel = page.locator('[data-testid="dock-tab-label"]').first();
    await expect(tabLabel).toBeVisible();
    const labelText = await tabLabel.textContent();
    console.log('INITIAL LABEL:', labelText);

    await page.screenshot({ path: 'e2e/screenshots/tab_rename_01_before.png' });

    // Double-click to start editing
    await tabLabel.dblclick();
    await page.waitForTimeout(200);

    await page.screenshot({ path: 'e2e/screenshots/tab_rename_02_after_dblclick.png' });

    const editableAfter = await tabLabel.getAttribute('contenteditable');
    console.log('CONTENTEDITABLE AFTER:', editableAfter);
    expect(editableAfter).toBe('true');

    // Type a new name (text is already selected via selectAllText)
    await page.keyboard.type('My Custom Chart');

    await page.screenshot({ path: 'e2e/screenshots/tab_rename_03_typing.png' });

    // Press Enter to commit
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    await page.screenshot({ path: 'e2e/screenshots/tab_rename_04_committed.png' });

    const editableCommitted = await tabLabel.getAttribute('contenteditable');
    console.log('CONTENTEDITABLE AFTER COMMIT:', editableCommitted);
    expect(editableCommitted).not.toBe('true');

    const finalText = await tabLabel.textContent();
    console.log('FINAL LABEL:', finalText);
    expect(finalText).toBe('My Custom Chart');
  });

  test('Escape cancels editing', async ({ page }) => {
    const tabLabel = page.locator('[data-testid="dock-tab-label"]').first();
    await expect(tabLabel).toBeVisible();
    const originalText = await tabLabel.textContent();
    console.log('ORIGINAL TEXT:', originalText);

    await tabLabel.dblclick();
    await page.waitForTimeout(200);

    await page.keyboard.type('SHOULD BE CANCELLED');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    const afterEscape = await tabLabel.textContent();
    console.log('AFTER ESCAPE:', afterEscape);
    expect(afterEscape).toBe(originalText);
  });
});
