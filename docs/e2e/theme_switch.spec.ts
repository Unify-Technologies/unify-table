import { test } from "./fixtures";
import { navigateSPA, waitForDuckDB, toggleTheme, assertTheme } from "./helpers";

const PAGES_WITH_TABLES: { route: string; label: string }[] = [
  { route: "/table-basics", label: "Table Basics" },
  // /themes excluded — its example has an independent theme toggle
  { route: "/plugins/selection", label: "Selection" },
  { route: "/plugins/filters", label: "Filters" },
  { route: "/plugins/editing", label: "Editing" },
  { route: "/plugins/context-menu", label: "Context Menu" },
  { route: "/plugins/clipboard", label: "Clipboard" },
  { route: "/plugins/column-resize", label: "Column Resize" },
  { route: "/plugins/column-reorder", label: "Column Reorder" },
  { route: "/plugins/column-pin", label: "Column Pin" },
  { route: "/plugins/row-grouping", label: "Row Grouping" },
  { route: "/plugins/formatting", label: "Formatting" },
  { route: "/plugins/status-bar", label: "Status Bar" },
  { route: "/plugins/find-replace", label: "Find & Replace" },
  { route: "/plugins/formulas", label: "Formulas" },
  { route: "/plugins/table-io", label: "Table IO" },
  { route: "/presets", label: "Presets" },
  { route: "/density-layout", label: "Density & Layout" },
  { route: "/filter-system", label: "Filter System" },
  { route: "/displays/chart", label: "Chart Display" },
  { route: "/displays/stats", label: "Stats Display" },
  { route: "/displays/pivot", label: "Pivot Display" },
  { route: "/displays/timeline", label: "Timeline Display" },
  { route: "/displays/correlation", label: "Correlation Display" },
  { route: "/displays/summary", label: "Summary Display" },
  { route: "/displays/outliers", label: "Outliers Display" },
  { route: "/panels", label: "Panels" },
  // /headless excluded — uses useTableContext (headless, no styled elements)
];

test.describe("Theme switching on all pages with tables", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120000);

  for (const { route, label } of PAGES_WITH_TABLES) {
    test(`${label} — dark → light → dark`, async ({ page }) => {
      await navigateSPA(page, route);
      await waitForDuckDB(page);
      // Wait for theme-classed content to render (table cells, headers, or containers)
      await page.locator('[class*="utbl-dark-"], [class*="utbl-light-"]').first().waitFor({ timeout: 15000 });

      await assertTheme(page, "dark");

      await toggleTheme(page);
      await assertTheme(page, "light");

      await toggleTheme(page);
      await assertTheme(page, "dark");
    });
  }
});
