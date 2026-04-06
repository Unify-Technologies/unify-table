import { test, expect } from "./fixtures";
import { navigateSPA, waitForContent, ensureDarkTheme, toggleToLight } from "./helpers";

test.describe("Documentation Site Audit", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await ensureDarkTheme(page);
  });

  // ─── HOME PAGE ───
  test("01+02 - Home page dark & light", async ({ page }) => {
    await navigateSPA(page, "/");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/01_home_dark.png", fullPage: true });
    await toggleToLight(page);
    await page.screenshot({ path: "e2e/screenshots/02_home_light.png", fullPage: true });
  });

  // ─── GETTING STARTED ───
  test("03+04 - Getting Started dark & light", async ({ page }) => {
    await navigateSPA(page, "/getting-started");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/03_getting_started_dark.png", fullPage: true });
    await toggleToLight(page);
    await page.screenshot({ path: "e2e/screenshots/04_getting_started_light.png", fullPage: true });
  });

  // ─── TABLE BASICS ───
  test("05+06 - Table Basics dark & light", async ({ page }) => {
    await navigateSPA(page, "/table-basics");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/05_table_basics_dark.png", fullPage: true });
    await toggleToLight(page);
    await page.screenshot({ path: "e2e/screenshots/06_table_basics_light.png", fullPage: true });
  });

  // ─── COLUMN DEFINITIONS ───
  test("07+08 - Column Definitions dark & light", async ({ page }) => {
    await navigateSPA(page, "/column-definitions");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/07_column_defs_dark.png", fullPage: true });
    await toggleToLight(page);
    await page.screenshot({ path: "e2e/screenshots/08_column_defs_light.png", fullPage: true });
  });

  // ─── THEMES ───
  test("09+10 - Themes dark & light", async ({ page }) => {
    await navigateSPA(page, "/themes");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/09_themes_dark.png", fullPage: true });
    await toggleToLight(page);
    await page.screenshot({ path: "e2e/screenshots/10_themes_light.png", fullPage: true });
  });

  // ─── PLUGIN PAGES ───
  test("11 - Plugin Overview dark", async ({ page }) => {
    await navigateSPA(page, "/plugins");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/11_plugin_overview_dark.png", fullPage: true });
  });

  test("12+13 - Selection plugin dark & light", async ({ page }) => {
    await navigateSPA(page, "/plugins/selection");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/12_selection_dark.png", fullPage: true });
    await toggleToLight(page);
    await page.screenshot({ path: "e2e/screenshots/13_selection_light.png", fullPage: true });
  });

  test("14 - Filters plugin dark", async ({ page }) => {
    await navigateSPA(page, "/plugins/filters");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/14_filters_dark.png", fullPage: true });
  });

  test("15 - Context Menu plugin dark", async ({ page }) => {
    await navigateSPA(page, "/plugins/context-menu");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/15_context_menu_dark.png", fullPage: true });
  });

  test("16 - Editing plugin dark", async ({ page }) => {
    await navigateSPA(page, "/plugins/editing");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/16_editing_dark.png", fullPage: true });
  });

  test("17 - Row Grouping plugin dark", async ({ page }) => {
    await navigateSPA(page, "/plugins/row-grouping");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/17_row_grouping_dark.png", fullPage: true });
  });

  // ─── DISPLAY PAGES ───
  test("18 - Display Overview dark", async ({ page }) => {
    await navigateSPA(page, "/displays");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/18_display_overview_dark.png", fullPage: true });
  });

  test("19+20 - Chart display dark & light", async ({ page }) => {
    await navigateSPA(page, "/displays/chart");
    await page.locator("canvas").first().waitFor({ timeout: 15000 });
    await page.screenshot({ path: "e2e/screenshots/19_chart_display_dark.png", fullPage: true });
    await toggleToLight(page);
    await page.locator("canvas").first().waitFor({ timeout: 15000 });
    await page.screenshot({ path: "e2e/screenshots/20_chart_display_light.png", fullPage: true });
  });

  test("21 - Stats display dark", async ({ page }) => {
    await navigateSPA(page, "/displays/stats");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/21_stats_display_dark.png", fullPage: true });
  });

  test("22 - Pivot display dark", async ({ page }) => {
    await navigateSPA(page, "/displays/pivot");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/22_pivot_display_dark.png", fullPage: true });
    const errorText = await page.locator("text=Example error").count();
    expect(errorText).toBe(0);
  });

  // ─── DATA LAYER ───
  test("23+24 - SQL Builder dark & light", async ({ page }) => {
    await navigateSPA(page, "/sql-builder");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/23_sql_builder_dark.png", fullPage: true });
    await toggleToLight(page);
    await page.screenshot({ path: "e2e/screenshots/24_sql_builder_light.png", fullPage: true });
  });

  test("25 - Filter System dark", async ({ page }) => {
    await navigateSPA(page, "/filter-system");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/25_filter_system_dark.png", fullPage: true });
  });

  test("26 - Query Engine dark", async ({ page }) => {
    await navigateSPA(page, "/query-engine");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/26_query_engine_dark.png", fullPage: true });
  });

  // ─── OTHER ───
  test("27 - Presets dark", async ({ page }) => {
    await navigateSPA(page, "/presets");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/27_presets_dark.png", fullPage: true });
  });

  test("28 - Headless dark", async ({ page }) => {
    await navigateSPA(page, "/headless");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/28_headless_dark.png", fullPage: true });
  });

  test("29 - Panels dark", async ({ page }) => {
    await navigateSPA(page, "/panels");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/29_panels_dark.png", fullPage: true });
  });

  test("30 - How It Works dark", async ({ page }) => {
    await navigateSPA(page, "/how-it-works");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/30_how_it_works_dark.png", fullPage: true });
  });

  test("31 - Density & Layout dark", async ({ page }) => {
    await navigateSPA(page, "/density-layout");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/31_density_dark.png", fullPage: true });
    const heading = page.locator("h1");
    await heading.first().waitFor({ timeout: 10000 });
    const text = await heading.first().textContent();
    expect(text).toContain("Density");
  });

  test("32 - Charts page dark", async ({ page }) => {
    await navigateSPA(page, "/charts");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/32_charts_dark.png", fullPage: true });
  });

  // ─── SEARCH ───
  test("35 - Search dialog", async ({ page }) => {
    await navigateSPA(page, "/");
    await page.keyboard.press("Meta+k");
    const searchDialog = page.locator('[role="dialog"], [class*="search"], input[type="search"], input[placeholder*="earch"]');
    await searchDialog.first().waitFor({ timeout: 5000 });
    await page.keyboard.type("filter");
    await page
      .locator('[class*="search"] a, [role="option"], [class*="result"]')
      .first()
      .waitFor({ timeout: 2000 })
      .catch(() => {});
    await page.screenshot({ path: "e2e/screenshots/35_search.png", fullPage: false });
    await page.keyboard.press("Escape");
  });

  // ─── MOBILE ───
  test("36+37 - Mobile home & sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await navigateSPA(page, "/");
    await waitForContent(page);
    await page.screenshot({ path: "e2e/screenshots/36_mobile_home.png", fullPage: true });
    const menuBtn = page.locator("button:has-text('Menu')");
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page
        .locator('[class*="drawer"], [class*="sidebar"], nav')
        .first()
        .waitFor({ timeout: 3000 })
        .catch(() => {});
    }
    await page.screenshot({ path: "e2e/screenshots/37_mobile_sidebar.png", fullPage: false });
    await page.setViewportSize({ width: 1440, height: 900 });
  });
});
