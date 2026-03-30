import { test, expect } from '@playwright/test';

test.describe('Row Grouping — formatting parity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-index="0"]', { timeout: 30_000 });
  });

  test('group row cells use same formatting and styling as data rows', async ({ page }) => {
    const allTabs = page.locator('.utbl-tab-btn');

    // Open Columns panel and set SUM aggregations for P&L and Volume
    await allTabs.nth(2).click();
    const panel = page.locator('.utbl-panel-content').first();
    await expect(panel).toBeVisible();
    const selects = panel.locator('.utbl-select');
    await selects.nth(2).selectOption('sum');   // P&L
    await selects.nth(6).selectOption('sum');   // Volume
    await allTabs.nth(2).click();
    await page.waitForTimeout(200);

    // Open Group By panel and group by Ticker
    await allTabs.nth(1).click();
    await expect(page.locator('.utbl-panel-content').first()).toBeVisible();
    await page.locator('.utbl-panel-content').first().getByText('Ticker').click();
    await page.waitForTimeout(1500);

    // Close panel
    await allTabs.nth(1).click();
    await page.waitForTimeout(300);

    // Inspect group row
    const groupRow = page.locator('[data-index="0"]').first();
    const cells = groupRow.locator(':scope > div');
    const cellCount = await cells.count();

    // Volume (last column) should have compact notation
    const volumeText = (await cells.nth(cellCount - 1).textContent())?.trim() ?? '';
    expect(volumeText).toMatch(/[KMB]/);

    // P&L should have $ formatting
    const pnlText = (await cells.nth(2).textContent())?.trim() ?? '';
    expect(pnlText).toContain('$');

    // No raw 10+ digit numbers
    const groupText = await groupRow.textContent();
    expect(groupText).not.toMatch(/\d{10,}/);

    // Verify all group row cells have the base cell class (styles parity)
    for (let i = 0; i < cellCount; i++) {
      const cls = await cells.nth(i).getAttribute('class');
      expect(cls).toContain('utbl-dark-cell');
      expect(cls).toContain('utbl-dark-group-row');
    }

    // P&L cell should have conditional formatting color (green for positive)
    const pnlStyle = await cells.nth(2).getAttribute('style');
    // Positive P&L should have green color from the formatting plugin
    if (pnlText.startsWith('$') && !pnlText.startsWith('-$')) {
      expect(pnlStyle).toContain('color');
    }
  });
});
