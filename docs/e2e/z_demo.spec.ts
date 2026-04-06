/**
 * Demo page tests — run LAST because the 1M row generation consumes
 * significant memory that can affect subsequent tests.
 */
import { test, expect } from "./fixtures";
import { navigateSPA, ensureDarkTheme, toggleTheme } from "./helpers";

test.describe("Demo Page", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120000);

  test("33 - Demo page loaded", async ({ page }) => {
    await navigateSPA(page, "/demo");
    // Wait for demo data (1M rows) to generate — content appears only when ready
    await page.locator('[data-index="0"], .utbl-row, .utbl-vrow, canvas').first().waitFor({ timeout: 90000 });
    await page.screenshot({ path: "e2e/screenshots/33_demo_loaded.png", fullPage: false });
  });

  test("34 - Demo right-click context menu", async ({ page }) => {
    // Demo data already generated from test 33 (executedSeeds cache)
    await navigateSPA(page, "/demo");
    await page.locator(".utbl-row, .utbl-vrow, [data-index]").first().waitFor({ timeout: 30000 });
    const row = page.locator(".utbl-row, .utbl-vrow, [data-index]").first();
    if (await row.isVisible()) {
      const box = await row.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: "right" });
        await page
          .waitForFunction(
            () => {
              const divs = document.querySelectorAll("body > div");
              for (const d of divs) {
                if ((d as HTMLElement).style.position === "fixed") return true;
              }
              return false;
            },
            null,
            { timeout: 5000 },
          )
          .catch(() => {});
      }
    }
    await page.screenshot({ path: "e2e/screenshots/34_demo_ctx_menu.png", fullPage: false });
  });

  test("Demo page — dark → light", async ({ page }) => {
    await ensureDarkTheme(page);
    await navigateSPA(page, "/demo");
    // Demo data already generated (executedSeeds cache)
    await page.locator("[data-index], .utbl-vrow, canvas").first().waitFor({ timeout: 30000 });

    const darkCells = await page.locator('[class*="utbl-dark-cell"]').count();
    expect(darkCells).toBeGreaterThan(0);

    await toggleTheme(page);

    const lightCells = await page.locator('[class*="utbl-light-cell"]').count();
    const remainingDark = await page.locator('[class*="utbl-dark-cell"]').count();
    expect(lightCells).toBeGreaterThan(0);
    expect(remainingDark).toBe(0);
  });
});
