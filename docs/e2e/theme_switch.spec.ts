import { test, expect, type Page } from "@playwright/test";

const BASE = "http://localhost:5173/unify-table/";

async function waitForTable(page: Page) {
  await page.waitForFunction(
    () => {
      const root = document.getElementById("root");
      return (
        root &&
        !root.innerHTML.includes("INITIALIZING") &&
        root.querySelector("[data-index], .utbl-scroll")
      );
    },
    { timeout: 30000 },
  );
}

async function toggleTheme(page: Page) {
  // The theme toggle is the last button in the header (sun/moon icon)
  const toggleBtn = page.locator("header button").last();
  await toggleBtn.click();
  await page.waitForTimeout(300);
}

/** Check that all table containers/cells use the expected theme prefix. */
async function assertTheme(page: Page, expected: "dark" | "light") {
  const opposite = expected === "dark" ? "light" : "dark";

  // Check container classes
  const containers = page.locator(`[class*="utbl-${expected}-container"]`);
  const oppositeContainers = page.locator(`[class*="utbl-${opposite}-container"]`);
  const containerCount = await containers.count();
  const oppositeCount = await oppositeContainers.count();

  // Check cell classes
  const cells = page.locator(`[class*="utbl-${expected}-cell"]`);
  const oppositeCells = page.locator(`[class*="utbl-${opposite}-cell"]`);
  const cellCount = await cells.count();
  const oppositeCellCount = await oppositeCells.count();

  // Check header classes
  const headers = page.locator(`[class*="utbl-${expected}-header"]`);
  const oppositeHeaders = page.locator(`[class*="utbl-${opposite}-header"]`);
  const headerCount = await headers.count();
  const oppositeHeaderCount = await oppositeHeaders.count();

  // At least one themed element should exist
  expect(containerCount + cellCount + headerCount).toBeGreaterThan(0);
  // No elements from the opposite theme should exist
  expect(oppositeCount + oppositeCellCount + oppositeHeaderCount).toBe(0);
}

// Pages with table examples (route hash + human label)
const PAGES_WITH_TABLES: { route: string; label: string; waitForCanvas?: boolean }[] = [
  { route: "#/table-basics", label: "Table Basics" },
  { route: "#/themes", label: "Themes" },
  { route: "#/plugins/selection", label: "Selection" },
  { route: "#/plugins/filters", label: "Filters" },
  { route: "#/plugins/editing", label: "Editing" },
  { route: "#/plugins/context-menu", label: "Context Menu" },
  { route: "#/plugins/clipboard", label: "Clipboard" },
  { route: "#/plugins/column-resize", label: "Column Resize" },
  { route: "#/plugins/column-reorder", label: "Column Reorder" },
  { route: "#/plugins/column-pin", label: "Column Pin" },
  { route: "#/plugins/row-grouping", label: "Row Grouping" },
  { route: "#/plugins/formatting", label: "Formatting" },
  { route: "#/plugins/status-bar", label: "Status Bar" },
  { route: "#/plugins/find-replace", label: "Find & Replace" },
  { route: "#/plugins/formulas", label: "Formulas" },
  { route: "#/plugins/table-io", label: "Table IO" },
  { route: "#/presets", label: "Presets" },
  { route: "#/density-layout", label: "Density & Layout" },
  { route: "#/filter-system", label: "Filter System" },
  { route: "#/displays/chart", label: "Chart Display", waitForCanvas: true },
  { route: "#/displays/stats", label: "Stats Display" },
  { route: "#/displays/pivot", label: "Pivot Display" },
  { route: "#/displays/timeline", label: "Timeline Display", waitForCanvas: true },
  { route: "#/displays/correlation", label: "Correlation Display", waitForCanvas: true },
  { route: "#/displays/summary", label: "Summary Display" },
  { route: "#/displays/outliers", label: "Outliers Display" },
  { route: "#/panels", label: "Panels" },
  { route: "#/headless", label: "Headless" },
];

test.describe("Theme switching on all pages with tables", () => {
  test.setTimeout(120000);

  test("Demo page — dark → light", async ({ page }) => {
    await page.goto(BASE + "#/demo");
    await page.waitForFunction(
      () => !document.body.innerHTML.includes("Generating"),
      { timeout: 60000 },
    );
    await page.locator("[data-index], .utbl-scroll, canvas").first().waitFor({ timeout: 15000 });

    // Should have dark theme
    const darkCells = await page.locator('[class*="utbl-dark-cell"]').count();
    expect(darkCells).toBeGreaterThan(0);

    // Toggle to light
    await toggleTheme(page);

    const lightCells = await page.locator('[class*="utbl-light-cell"]').count();
    const remainingDark = await page.locator('[class*="utbl-dark-cell"]').count();
    expect(lightCells).toBeGreaterThan(0);
    expect(remainingDark).toBe(0);
  });

  for (const { route, label, waitForCanvas } of PAGES_WITH_TABLES) {
    test(`${label} — dark → light → dark`, async ({ page }) => {
      await page.goto(BASE + route);
      await waitForTable(page);
      if (waitForCanvas) {
        await page.locator("canvas").first().waitFor({ timeout: 15000 }).catch(() => {});
      }

      // Starts in dark mode
      await assertTheme(page, "dark");
      await page.screenshot({
        path: `e2e/screenshots/theme_${label.replace(/[^a-zA-Z0-9]/g, "_")}_dark.png`,
        fullPage: true,
      });

      // Toggle to light
      await toggleTheme(page);
      await assertTheme(page, "light");
      await page.screenshot({
        path: `e2e/screenshots/theme_${label.replace(/[^a-zA-Z0-9]/g, "_")}_light.png`,
        fullPage: true,
      });

      // Toggle back to dark
      await toggleTheme(page);
      await assertTheme(page, "dark");
    });
  }
});
