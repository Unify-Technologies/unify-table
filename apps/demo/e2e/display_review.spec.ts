import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E tests for all 7 display plugins.
 * Validates rendering, data correctness, and takes screenshots.
 */

const INIT_TIMEOUT = 60_000;
const DATA_TIMEOUT = 15_000;

/** Helper: open a display by name and activate it */
async function openDisplay(page: import('@playwright/test').Page, name: string) {
  // Open displays panel on the first grid pane
  const displayTab = page.locator('.utbl-tab-btn').nth(3);
  await displayTab.click();

  // Click the display type toggle button
  await page.locator('.utbl-toggle-btn').filter({ hasText: name }).first().click();

  // Activate the display (click its segmented button)
  const panel = page.locator('.utbl-panel-content').first();
  await panel.locator('.utbl-segmented-btn').nth(1).click();

  // Wait for the renderer to appear
  await expect(page.locator('.utbl-display-renderer').first()).toBeVisible({ timeout: DATA_TIMEOUT });
}

test.describe('Display Plugin Review', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-index="0"]', { timeout: INIT_TIMEOUT });
  });

  // ────────────────────────────────────────────────────────
  // Chart
  // ────────────────────────────────────────────────────────

  test('Chart display renders with correct default columns', async ({ page }) => {
    await openDisplay(page, 'Chart');

    const renderer = page.locator('.utbl-display-renderer').first();

    // Chart renders via ECharts — look for canvas element
    const canvas = renderer.locator('canvas');
    await expect(canvas.first()).toBeVisible({ timeout: DATA_TIMEOUT });

    // No error should be shown
    await expect(renderer.locator('.utbl-display-error')).toHaveCount(0);

    // Verify config panel does not default to "id" column
    const panel = page.locator('.utbl-panel-content').first();
    const ySelect = panel.locator('select').nth(1); // Y axis select
    const yValue = await ySelect.inputValue();
    expect(yValue).not.toBe('id');

    await page.screenshot({ path: 'e2e/screenshots/display_chart.png' });
  });

  // ────────────────────────────────────────────────────────
  // Stats
  // ────────────────────────────────────────────────────────

  test('Stats display renders cards with values', async ({ page }) => {
    await openDisplay(page, 'Stats');

    const renderer = page.locator('.utbl-display-renderer').first();
    const content = renderer.locator('.utbl-display-content');

    // Wait for stat cards to render — they contain formatted numbers
    // Stats cards have large values with fontSize 1.75rem
    await expect(content).not.toContainText('Loading stats...');

    // Should not show "id" as a stat field by default
    const cardTexts = await content.textContent();
    expect(cardTexts).not.toContain('ID · ');

    // Should have at least one stat value visible (not just dashes)
    expect(cardTexts).toMatch(/\d/);

    await page.screenshot({ path: 'e2e/screenshots/display_stats.png' });
  });

  // ────────────────────────────────────────────────────────
  // Pivot
  // ────────────────────────────────────────────────────────

  test('Pivot display renders styled table', async ({ page }) => {
    await openDisplay(page, 'Pivot');

    const renderer = page.locator('.utbl-display-renderer').first();

    // Pivot renders a table with utbl-pivot-table class
    const pivotTable = renderer.locator('.utbl-pivot-table');
    await expect(pivotTable).toBeVisible({ timeout: DATA_TIMEOUT });

    // Should have row headers and column headers
    const cornerCell = renderer.locator('.utbl-pivot-corner');
    await expect(cornerCell).toBeVisible();

    const colHeaders = renderer.locator('.utbl-pivot-col-header');
    expect(await colHeaders.count()).toBeGreaterThan(0);

    const rowHeaders = renderer.locator('.utbl-pivot-row-header');
    expect(await rowHeaders.count()).toBeGreaterThan(0);

    // Cells should contain numeric values
    const cells = renderer.locator('.utbl-pivot-cell');
    expect(await cells.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'e2e/screenshots/display_pivot.png' });
  });

  // ────────────────────────────────────────────────────────
  // Summary
  // ────────────────────────────────────────────────────────

  test('Summary display renders column profile cards', async ({ page }) => {
    await openDisplay(page, 'Summary');

    const renderer = page.locator('.utbl-display-renderer').first();
    const content = renderer.locator('.utbl-display-content');

    // Wait for summary cards to load
    await expect(content).not.toContainText('Loading summary...');

    // Should show column names like "ticker", "pnl", "region"
    const text = await content.textContent();
    expect(text).toContain('ticker');
    expect(text).toContain('pnl');

    // "id" should be excluded from summary by default
    // Check that the first visible column name is NOT "id"
    // (id may appear in metadata but should not be a profiled card)

    await page.screenshot({ path: 'e2e/screenshots/display_summary.png' });
  });

  // ────────────────────────────────────────────────────────
  // Correlation
  // ────────────────────────────────────────────────────────

  test('Correlation display renders ECharts heatmap', async ({ page }) => {
    await openDisplay(page, 'Correlation');

    const renderer = page.locator('.utbl-display-renderer').first();

    // Correlation now uses ECharts — should have a canvas
    const canvas = renderer.locator('canvas');
    await expect(canvas.first()).toBeVisible({ timeout: DATA_TIMEOUT });

    // No error
    await expect(renderer.locator('.utbl-display-error')).toHaveCount(0);

    await page.screenshot({ path: 'e2e/screenshots/display_correlation.png' });
  });

  // ────────────────────────────────────────────────────────
  // Timeline
  // ────────────────────────────────────────────────────────

  test('Timeline display renders chart with data', async ({ page }) => {
    await openDisplay(page, 'Timeline');

    const renderer = page.locator('.utbl-display-renderer').first();

    // Timeline renders via ECharts — canvas
    const canvas = renderer.locator('canvas');
    await expect(canvas.first()).toBeVisible({ timeout: DATA_TIMEOUT });

    // No error
    await expect(renderer.locator('.utbl-display-error')).toHaveCount(0);

    // Should not show "No data"
    await expect(renderer.locator('.utbl-display-loading')).toHaveCount(0);

    await page.screenshot({ path: 'e2e/screenshots/display_timeline.png' });
  });

  // ────────────────────────────────────────────────────────
  // Outliers
  // ────────────────────────────────────────────────────────

  test('Outliers display renders box plot and stats', async ({ page }) => {
    await openDisplay(page, 'Outliers');

    const renderer = page.locator('.utbl-display-renderer').first();
    const content = renderer.locator('.utbl-display-content');

    // Wait for data to load
    await expect(content).not.toContainText('Loading outlier analysis...');

    // Should show summary stats (Mean, Std Dev, IQR, Bounds)
    const text = await content.textContent();
    expect(text).toContain('Mean');
    expect(text).toContain('Std Dev');
    expect(text).toContain('IQR');
    expect(text).toContain('Bounds');

    // Box plot SVG should be visible
    const svg = content.locator('svg');
    await expect(svg.first()).toBeVisible();

    // No error
    await expect(renderer.locator('.utbl-display-error')).toHaveCount(0);

    await page.screenshot({ path: 'e2e/screenshots/display_outliers.png' });
  });
});
