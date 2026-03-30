import { test, expect } from '@playwright/test';

test.describe('Unify Table Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for DuckDB to initialize and at least one table to render rows
    await page.waitForSelector('[data-index="0"]', { timeout: 30_000 });
  });

  test('page loads with header', async ({ page }) => {
    await expect(page.locator('text=Unify Table')).toBeVisible();
  });

  test('four table panes render', async ({ page }) => {
    // Each pane has a label badge (A, B, C, D)
    for (const label of ['A', 'B', 'C', 'D']) {
      await expect(page.locator(`text=${label}`).first()).toBeVisible();
    }
  });

  test('tables render rows', async ({ page }) => {
    // At least a few virtual rows should be visible across all tables
    const rows = page.locator('[data-index]');
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    // 4 grids, each showing many rows — should be well over 20
    expect(count).toBeGreaterThan(20);
  });

  test('dark mode toggle works', async ({ page }) => {
    // App starts in dark mode
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Click the theme toggle button (Sun icon visible in dark mode)
    await page.locator('header button').click();
    await expect(html).not.toHaveClass(/dark/);

    // Toggle back
    await page.locator('header button').click();
    await expect(html).toHaveClass(/dark/);
  });

  test('panel tab strip is visible per table', async ({ page }) => {
    // Each grid should have panel tab buttons (Filters, Group, Columns, Displays, Export, Debug)
    const filterTabs = page.locator('.utbl-tab-btn');
    // 4 grids × 6 tabs = 24 tab buttons
    const count = await filterTabs.count();
    expect(count).toBe(24);
  });

  test('clicking a panel tab opens the panel', async ({ page }) => {
    // Click the first "Filters" tab
    const firstFilterTab = page.locator('.utbl-tab-btn').first();
    await firstFilterTab.click();

    // Panel content should appear
    await expect(page.locator('.utbl-panel-content').first()).toBeVisible();

    // Should have a search input
    await expect(page.locator('.utbl-panel-content .utbl-input').first()).toBeVisible();
  });

  test('clicking the same tab again closes the panel', async ({ page }) => {
    const firstTab = page.locator('.utbl-tab-btn').first();
    await firstTab.click();
    await expect(page.locator('.utbl-panel-content').first()).toBeVisible();

    // Click again to close
    await firstTab.click();
    // Panel content should no longer be visible for that grid
    // Wait a tick for state update
    await page.waitForTimeout(100);
    const panelContents = page.locator('.utbl-panel-content');
    const count = await panelContents.count();
    expect(count).toBe(0);
  });

  test('sort works on column click', async ({ page }) => {
    // Click the "Ticker" header in the first grid to sort
    await page.locator('text=Ticker').first().click();
    // After sorting, the first visible row should have a ticker starting with 'A' (AAPL or AMZN)
    const firstCell = page.locator('[data-index="0"]').first().locator('div').nth(1);
    const text = await firstCell.textContent();
    expect(text?.startsWith('A')).toBeTruthy();
  });

  test('filter panel can filter data', async ({ page }) => {
    // Open filters panel on first grid
    const firstFilterTab = page.locator('.utbl-tab-btn').first();
    await firstFilterTab.click();

    // Type in the Ticker filter input
    const tickerInput = page.locator('.utbl-panel-content .utbl-field').nth(1).locator('.utbl-input');
    await tickerInput.fill('AAPL');

    // Wait for debounce (300ms) + query
    await page.waitForTimeout(500);

    // The first grid should now show only AAPL rows
    const firstRow = page.locator('[data-index="0"]').first();
    await expect(firstRow).toContainText('AAPL');
  });
});
