import { test, expect } from '@playwright/test';

test.describe('Display Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for DuckDB to initialize and render table rows
    await page.waitForSelector('[data-index="0"]', { timeout: 60_000 });
  });

  test('display tab icon is visible in panel strip', async ({ page }) => {
    const tabBtns = page.locator('.utbl-tab-btn');
    const count = await tabBtns.count();
    // 4 grids x 6 tabs (filters, groupBy, columns, displays, export, debug)
    expect(count).toBe(24);
  });

  test('clicking displays tab opens the display panel in catalogue mode', async ({ page }) => {
    const displayTab = page.locator('.utbl-tab-btn').nth(3);
    await displayTab.click();

    // Panel content should appear with toggle buttons
    const panel = page.locator('.utbl-panel-content').first();
    await expect(panel).toBeVisible();

    // Catalogue mode shows toggle buttons for each display type
    const toggleBtns = panel.locator('.utbl-toggle-btn');
    const count = await toggleBtns.count();
    expect(count).toBe(7); // Chart, Stats, Pivot, Summary, Correlation, Timeline, Outliers
  });

  test('display panel shows all 7 display type buttons', async ({ page }) => {
    const displayTab = page.locator('.utbl-tab-btn').nth(3);
    await displayTab.click();

    const panel = page.locator('.utbl-panel-content').first();
    await expect(panel).toContainText('Chart');
    await expect(panel).toContainText('Stats');
    await expect(panel).toContainText('Pivot');
    await expect(panel).toContainText('Summary');
    await expect(panel).toContainText('Correlation');
    await expect(panel).toContainText('Timeline');
    await expect(panel).toContainText('Outliers');
  });

  test('clicking add Chart switches to segmented mode', async ({ page }) => {
    const displayTab = page.locator('.utbl-tab-btn').nth(3);
    await displayTab.click();

    // Click the "Chart" toggle button
    await page.locator('.utbl-toggle-btn').filter({ hasText: 'Chart' }).first().click();

    // Should switch to segmented mode with Table + Chart buttons
    const panel = page.locator('.utbl-panel-content').first();
    const segmented = panel.locator('.utbl-segmented-btn');
    await expect(segmented.first()).toBeVisible();
    await expect(panel).toContainText('Table');
    await expect(panel).toContainText('Chart');
  });

  test('clicking display segmented button activates display renderer', async ({ page }) => {
    const displayTab = page.locator('.utbl-tab-btn').nth(3);
    await displayTab.click();

    // Add a Stats display
    await page.locator('.utbl-toggle-btn').filter({ hasText: 'Stats' }).first().click();

    // Click the Stats segmented button to activate it
    const panel = page.locator('.utbl-panel-content').first();
    await panel.locator('.utbl-segmented-btn').nth(1).click();

    // The display renderer should be visible
    await expect(page.locator('.utbl-display-renderer').first()).toBeVisible();
  });

  test('switching back to Table hides display renderer', async ({ page }) => {
    const displayTab = page.locator('.utbl-tab-btn').nth(3);
    await displayTab.click();

    // Add and activate a Stats display
    await page.locator('.utbl-toggle-btn').filter({ hasText: 'Stats' }).first().click();
    const panel = page.locator('.utbl-panel-content').first();
    await panel.locator('.utbl-segmented-btn').nth(1).click();
    await expect(page.locator('.utbl-display-renderer').first()).toBeVisible();

    // Switch back to Table
    await panel.locator('.utbl-segmented-btn').first().click();

    // Display renderer should be hidden
    await expect(page.locator('.utbl-display-renderer')).toHaveCount(0);
  });

  test('remove button removes a display and returns to catalogue', async ({ page }) => {
    const displayTab = page.locator('.utbl-tab-btn').nth(3);
    await displayTab.click();

    // Add a chart display
    await page.locator('.utbl-toggle-btn').filter({ hasText: 'Chart' }).first().click();

    // Click the close (X) button on the display segmented button
    const panel = page.locator('.utbl-panel-content').first();
    await panel.locator('.utbl-segmented-close').click();

    // Should return to catalogue mode with toggle buttons
    await expect(panel.locator('.utbl-toggle-btn').first()).toBeVisible();
  });

  test('adding Pivot display shows renderer', async ({ page }) => {
    const displayTab = page.locator('.utbl-tab-btn').nth(3);
    await displayTab.click();

    await page.locator('.utbl-toggle-btn').filter({ hasText: 'Pivot' }).first().click();
    const panel = page.locator('.utbl-panel-content').first();
    await panel.locator('.utbl-segmented-btn').nth(1).click();

    await expect(page.locator('.utbl-display-renderer').first()).toBeVisible();
  });

  test('adding Summary display shows renderer', async ({ page }) => {
    const displayTab = page.locator('.utbl-tab-btn').nth(3);
    await displayTab.click();

    await page.locator('.utbl-toggle-btn').filter({ hasText: 'Summary' }).first().click();
    const panel = page.locator('.utbl-panel-content').first();
    await panel.locator('.utbl-segmented-btn').nth(1).click();

    await expect(page.locator('.utbl-display-renderer').first()).toBeVisible();
  });

  test('adding Correlation display shows renderer', async ({ page }) => {
    const displayTab = page.locator('.utbl-tab-btn').nth(3);
    await displayTab.click();

    await page.locator('.utbl-toggle-btn').filter({ hasText: 'Correlation' }).first().click();
    const panel = page.locator('.utbl-panel-content').first();
    await panel.locator('.utbl-segmented-btn').nth(1).click();

    await expect(page.locator('.utbl-display-renderer').first()).toBeVisible();
  });

  test('adding Timeline display shows renderer', async ({ page }) => {
    const displayTab = page.locator('.utbl-tab-btn').nth(3);
    await displayTab.click();

    await page.locator('.utbl-toggle-btn').filter({ hasText: 'Timeline' }).first().click();
    const panel = page.locator('.utbl-panel-content').first();
    await panel.locator('.utbl-segmented-btn').nth(1).click();

    await expect(page.locator('.utbl-display-renderer').first()).toBeVisible();
  });

  test('adding Outliers display shows renderer', async ({ page }) => {
    const displayTab = page.locator('.utbl-tab-btn').nth(3);
    await displayTab.click();

    await page.locator('.utbl-toggle-btn').filter({ hasText: 'Outliers' }).first().click();
    const panel = page.locator('.utbl-panel-content').first();
    await panel.locator('.utbl-segmented-btn').nth(1).click();

    await expect(page.locator('.utbl-display-renderer').first()).toBeVisible();
  });

  test('display panel screenshot', async ({ page }) => {
    const displayTab = page.locator('.utbl-tab-btn').nth(3);
    await displayTab.click();

    await page.screenshot({ path: 'e2e/screenshots/display_panel.png' });
  });
});
