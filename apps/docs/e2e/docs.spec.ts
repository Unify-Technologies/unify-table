import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5174/unify-table/";

function waitForDuckDB(page: any) {
  return page.waitForFunction(
    () => {
      const root = document.getElementById("root");
      return root && root.innerHTML.length > 500 && !root.innerHTML.includes("INITIALIZING");
    },
    { timeout: 30000 },
  );
}

async function toggleToLight(page: any) {
  const toggleBtn = page.locator("header button").last();
  await toggleBtn.click();
  await page.waitForTimeout(500);
}

test.describe("Documentation Site Audit", () => {
  test.setTimeout(120000);

  // ─── HOME PAGE ───
  test("01 - Home page dark", async ({ page }) => {
    await page.goto(BASE);
    await waitForDuckDB(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e/screenshots/01_home_dark.png", fullPage: true });
  });

  test("02 - Home page light", async ({ page }) => {
    await page.goto(BASE);
    await waitForDuckDB(page);
    await toggleToLight(page);
    await page.screenshot({ path: "e2e/screenshots/02_home_light.png", fullPage: true });
  });

  // ─── GETTING STARTED ───
  test("03 - Getting Started dark", async ({ page }) => {
    await page.goto(BASE + "#/getting-started");
    await waitForDuckDB(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e/screenshots/03_getting_started_dark.png", fullPage: true });
  });

  test("04 - Getting Started light", async ({ page }) => {
    await page.goto(BASE + "#/getting-started");
    await waitForDuckDB(page);
    await toggleToLight(page);
    await page.screenshot({ path: "e2e/screenshots/04_getting_started_light.png", fullPage: true });
  });

  // ─── TABLE BASICS ───
  test("05 - Table Basics dark", async ({ page }) => {
    await page.goto(BASE + "#/table-basics");
    await waitForDuckDB(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e/screenshots/05_table_basics_dark.png", fullPage: true });
  });

  test("06 - Table Basics light", async ({ page }) => {
    await page.goto(BASE + "#/table-basics");
    await waitForDuckDB(page);
    await page.waitForTimeout(1000);
    await toggleToLight(page);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "e2e/screenshots/06_table_basics_light.png", fullPage: true });
  });

  // ─── COLUMN DEFINITIONS ───
  test("07 - Column Definitions dark", async ({ page }) => {
    await page.goto(BASE + "#/column-definitions");
    await waitForDuckDB(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e/screenshots/07_column_defs_dark.png", fullPage: true });
  });

  test("08 - Column Definitions light", async ({ page }) => {
    await page.goto(BASE + "#/column-definitions");
    await waitForDuckDB(page);
    await toggleToLight(page);
    await page.screenshot({ path: "e2e/screenshots/08_column_defs_light.png", fullPage: true });
  });

  // ─── THEMES ───
  test("09 - Themes dark", async ({ page }) => {
    await page.goto(BASE + "#/themes");
    await waitForDuckDB(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e/screenshots/09_themes_dark.png", fullPage: true });
  });

  test("10 - Themes light", async ({ page }) => {
    await page.goto(BASE + "#/themes");
    await waitForDuckDB(page);
    await toggleToLight(page);
    await page.screenshot({ path: "e2e/screenshots/10_themes_light.png", fullPage: true });
  });

  // ─── PLUGIN PAGES ───
  test("11 - Plugin Overview dark", async ({ page }) => {
    await page.goto(BASE + "#/plugins");
    await waitForDuckDB(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e/screenshots/11_plugin_overview_dark.png", fullPage: true });
  });

  test("12 - Selection plugin dark", async ({ page }) => {
    await page.goto(BASE + "#/plugins/selection");
    await waitForDuckDB(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e/screenshots/12_selection_dark.png", fullPage: true });
  });

  test("13 - Selection plugin light", async ({ page }) => {
    await page.goto(BASE + "#/plugins/selection");
    await waitForDuckDB(page);
    await toggleToLight(page);
    await page.waitForTimeout(500);
    await page.screenshot({ path: "e2e/screenshots/13_selection_light.png", fullPage: true });
  });

  test("14 - Filters plugin dark", async ({ page }) => {
    await page.goto(BASE + "#/plugins/filters");
    await waitForDuckDB(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e/screenshots/14_filters_dark.png", fullPage: true });
  });

  test("15 - Context Menu plugin dark", async ({ page }) => {
    await page.goto(BASE + "#/plugins/context-menu");
    await waitForDuckDB(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e/screenshots/15_context_menu_dark.png", fullPage: true });
  });

  test("16 - Editing plugin dark", async ({ page }) => {
    await page.goto(BASE + "#/plugins/editing");
    await waitForDuckDB(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e/screenshots/16_editing_dark.png", fullPage: true });
  });

  test("17 - Row Grouping plugin dark", async ({ page }) => {
    await page.goto(BASE + "#/plugins/row-grouping");
    await waitForDuckDB(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e/screenshots/17_row_grouping_dark.png", fullPage: true });
  });

  // ─── DISPLAY PAGES ───
  test("18 - Display Overview dark", async ({ page }) => {
    await page.goto(BASE + "#/displays");
    await waitForDuckDB(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e/screenshots/18_display_overview_dark.png", fullPage: true });
  });

  test("19 - Chart display dark", async ({ page }) => {
    await page.goto(BASE + "#/displays/chart");
    await waitForDuckDB(page);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "e2e/screenshots/19_chart_display_dark.png", fullPage: true });
  });

  test("20 - Chart display light", async ({ page }) => {
    await page.goto(BASE + "#/displays/chart");
    await waitForDuckDB(page);
    await toggleToLight(page);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "e2e/screenshots/20_chart_display_light.png", fullPage: true });
  });

  test("21 - Stats display dark", async ({ page }) => {
    await page.goto(BASE + "#/displays/stats");
    await waitForDuckDB(page);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "e2e/screenshots/21_stats_display_dark.png", fullPage: true });
  });

  test("22 - Pivot display dark", async ({ page }) => {
    await page.goto(BASE + "#/displays/pivot");
    await waitForDuckDB(page);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "e2e/screenshots/22_pivot_display_dark.png", fullPage: true });
    // Verify no error text
    const errorText = await page.locator("text=Example error").count();
    expect(errorText).toBe(0);
  });

  // ─── DATA LAYER ───
  test("23 - SQL Builder dark", async ({ page }) => {
    await page.goto(BASE + "#/sql-builder");
    await waitForDuckDB(page);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "e2e/screenshots/23_sql_builder_dark.png", fullPage: true });
  });

  test("24 - SQL Builder light", async ({ page }) => {
    await page.goto(BASE + "#/sql-builder");
    await waitForDuckDB(page);
    await toggleToLight(page);
    await page.screenshot({ path: "e2e/screenshots/24_sql_builder_light.png", fullPage: true });
  });

  test("25 - Filter System dark", async ({ page }) => {
    await page.goto(BASE + "#/filter-system");
    await waitForDuckDB(page);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "e2e/screenshots/25_filter_system_dark.png", fullPage: true });
  });

  test("26 - Query Engine dark", async ({ page }) => {
    await page.goto(BASE + "#/query-engine");
    await waitForDuckDB(page);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "e2e/screenshots/26_query_engine_dark.png", fullPage: true });
  });

  // ─── OTHER ───
  test("27 - Presets dark", async ({ page }) => {
    await page.goto(BASE + "#/presets");
    await waitForDuckDB(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e/screenshots/27_presets_dark.png", fullPage: true });
  });

  test("28 - Headless dark", async ({ page }) => {
    await page.goto(BASE + "#/headless");
    await waitForDuckDB(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e/screenshots/28_headless_dark.png", fullPage: true });
  });

  test("29 - Panels dark", async ({ page }) => {
    await page.goto(BASE + "#/panels");
    await waitForDuckDB(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e/screenshots/29_panels_dark.png", fullPage: true });
  });

  test("30 - How It Works dark", async ({ page }) => {
    await page.goto(BASE + "#/how-it-works");
    await waitForDuckDB(page);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "e2e/screenshots/30_how_it_works_dark.png", fullPage: true });
  });

  test("31 - Density & Layout dark", async ({ page }) => {
    await page.goto(BASE + "#/density-layout");
    await waitForDuckDB(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e/screenshots/31_density_dark.png", fullPage: true });
    // Verify page has content
    await expect(page.locator("h1:has-text('Density')")).toBeVisible();
  });

  test("32 - Charts page dark", async ({ page }) => {
    await page.goto(BASE + "#/charts");
    await waitForDuckDB(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e/screenshots/32_charts_dark.png", fullPage: true });
  });

  // ─── DEMO + CONTEXT MENU BUG ───
  test("33 - Demo page loaded", async ({ page }) => {
    await page.goto(BASE + "#/demo");
    await page.waitForFunction(
      () => !document.body.innerHTML.includes("Generating"),
      { timeout: 60000 },
    );
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "e2e/screenshots/33_demo_loaded.png", fullPage: false });
  });

  test("34 - Demo right-click context menu", async ({ page }) => {
    await page.goto(BASE + "#/demo");
    await page.waitForFunction(
      () => !document.body.innerHTML.includes("Generating"),
      { timeout: 60000 },
    );
    await page.waitForTimeout(3000);
    // Right-click on a table row inside the "Trades" panel
    const row = page.locator(".utbl-row").first();
    if (await row.isVisible()) {
      const box = await row.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: "right" });
        await page.waitForTimeout(800);
      }
    }
    await page.screenshot({ path: "e2e/screenshots/34_demo_ctx_menu.png", fullPage: false });
  });

  // ─── SEARCH ───
  test("35 - Search dialog", async ({ page }) => {
    await page.goto(BASE);
    await waitForDuckDB(page);
    await page.keyboard.press("Meta+k");
    await page.waitForTimeout(500);
    await page.keyboard.type("filter");
    await page.waitForTimeout(500);
    await page.screenshot({ path: "e2e/screenshots/35_search.png", fullPage: false });
  });

  // ─── MOBILE ───
  test("36 - Mobile home", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await waitForDuckDB(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e/screenshots/36_mobile_home.png", fullPage: true });
  });

  test("37 - Mobile sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await waitForDuckDB(page);
    await page.waitForTimeout(1000);
    const menuBtn = page.locator("button:has-text('Menu')");
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: "e2e/screenshots/37_mobile_sidebar.png", fullPage: false });
  });
});
