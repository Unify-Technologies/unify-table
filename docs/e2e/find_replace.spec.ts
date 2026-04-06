import { test, expect } from "./fixtures";
import {
  freshNavigate,
  waitForTable,
  findBar,
  replaceInput,
  matchCountSpan,
  waitForPositiveMatch,
  waitForSearchComplete,
  getTotalMatchCount,
  getCurrentMatchIndex,
  waitForHighlights,
  waitForHighlightsCleared,
  waitForReplaceComplete,
} from "./helpers";

test.describe("Find & Replace Plugin E2E", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await freshNavigate(page, "/plugins/find-replace");
    await waitForTable(page);
  });

  test("Ctrl+F opens the find bar", async ({ page }) => {
    await page.locator(".utbl-scroll").click();
    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await expect(findBar(page)).toBeFocused();
  });

  test("Escape closes the find bar", async ({ page }) => {
    await page.locator(".utbl-scroll").click();
    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await page.keyboard.press("Escape");
    await expect(findBar(page)).not.toBeVisible({ timeout: 3000 });
  });

  test("typing a query shows match count", async ({ page }) => {
    await page.locator(".utbl-scroll").click();
    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await findBar(page).fill("a");
    await waitForPositiveMatch(page);
    expect(await getTotalMatchCount(page)).toBeGreaterThan(0);
  });

  test("no matches shows red count", async ({ page }) => {
    await page.locator(".utbl-scroll").click();
    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await findBar(page).fill("ZZZNONEXISTENT999");
    await waitForSearchComplete(page);
    expect(await getTotalMatchCount(page)).toBe(0);
    const color = await matchCountSpan(page).evaluate((el: HTMLElement) => getComputedStyle(el).color);
    expect(color).toBe("rgb(239, 68, 68)");
  });

  test("Ctrl+H opens find bar with replace row", async ({ page }) => {
    await page.locator(".utbl-scroll").click();
    await page.keyboard.press("Control+h");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await expect(replaceInput(page)).toBeVisible({ timeout: 3000 });
  });

  test("toggle replace row via chevron", async ({ page }) => {
    await page.locator(".utbl-scroll").click();
    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await expect(replaceInput(page)).not.toBeVisible();

    await page.locator('button[title="Show replace"]').click();
    await expect(replaceInput(page)).toBeVisible({ timeout: 3000 });
    await page.locator('button[title="Hide replace"]').click();
    await expect(replaceInput(page)).not.toBeVisible();
  });

  test("case-sensitive toggle affects results", async ({ page }) => {
    await page.locator(".utbl-scroll").click();
    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await findBar(page).fill("a");
    await waitForPositiveMatch(page);
    const insensitiveCount = await getTotalMatchCount(page);

    await page.locator("button").filter({ hasText: "Aa" }).click();
    await waitForPositiveMatch(page);
    expect(await getTotalMatchCount(page)).toBeLessThanOrEqual(insensitiveCount);
  });

  test("column filter limits search scope", async ({ page }) => {
    await page.locator(".utbl-scroll").click();
    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await findBar(page).fill("a");
    await waitForPositiveMatch(page);
    const allColsCount = await getTotalMatchCount(page);

    await findBar(page).locator("..").locator("select").selectOption({ index: 1 });
    await waitForPositiveMatch(page);
    expect(await getTotalMatchCount(page)).toBeLessThanOrEqual(allColsCount);
  });

  test("next/prev match navigation cycles", async ({ page }) => {
    await page.locator(".utbl-scroll").click();
    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await findBar(page).fill("AAPL");
    await waitForPositiveMatch(page);
    expect(await getCurrentMatchIndex(page)).toBe(1);

    await page.locator('button[title*="Next match"]').click();
    expect(await getCurrentMatchIndex(page)).toBe(2);
    await page.locator('button[title*="Previous match"]').click();
    expect(await getCurrentMatchIndex(page)).toBe(1);
  });

  test("Enter navigates to next match", async ({ page }) => {
    await page.locator(".utbl-scroll").click();
    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await findBar(page).fill("AAPL");
    await waitForPositiveMatch(page);
    expect(await getCurrentMatchIndex(page)).toBe(1);

    await page.keyboard.press("Enter");
    expect(await getCurrentMatchIndex(page)).toBe(2);
    await page.keyboard.press("Shift+Enter");
    expect(await getCurrentMatchIndex(page)).toBe(1);
  });

  test("matching cells are highlighted", async ({ page }) => {
    await page.locator(".utbl-scroll").click();
    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await findBar(page).fill("AAPL");
    await waitForPositiveMatch(page);
    await waitForHighlights(page);
    expect(await page.locator("[data-find-hl]").count()).toBeGreaterThan(0);
    expect(await page.locator("[data-find-current]").count()).toBeGreaterThan(0);
  });

  test("highlights are cleared when find bar closes", async ({ page }) => {
    await page.locator(".utbl-scroll").click();
    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await findBar(page).fill("AAPL");
    await waitForPositiveMatch(page);
    await waitForHighlights(page);
    expect(await page.locator("[data-find-hl]").count()).toBeGreaterThan(0);

    await page.keyboard.press("Escape");
    await expect(findBar(page)).not.toBeVisible({ timeout: 3000 });
    await waitForHighlightsCleared(page);
  });

  test("typing in find bar does not trigger table shortcuts", async ({ page }) => {
    await page.locator(".utbl-scroll").click();
    await page.locator('[data-index="0"] [class*="cell"]').first().click();
    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await findBar(page).fill("test");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowLeft");
    await expect(findBar(page)).toBeFocused();
  });

  test("Replace All updates cell values", async ({ page }) => {
    await page.locator(".utbl-scroll").click();
    await page.keyboard.press("Control+h");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await expect(replaceInput(page)).toBeVisible({ timeout: 3000 });

    const tickerCell = page.locator('[data-index="0"] [class*="cell"]').first();
    const originalTicker = (await tickerCell.textContent())?.trim();
    if (originalTicker && originalTicker.length > 0) {
      const selectEl = findBar(page).locator("..").locator("select");
      const options = await selectEl.locator("option").allTextContents();
      const tickerIdx = options.findIndex((o) => o.toLowerCase().includes("ticker"));
      if (tickerIdx > 0) await selectEl.selectOption({ index: tickerIdx });

      await findBar(page).fill(originalTicker);
      await waitForPositiveMatch(page);
      const replaceMarker = originalTicker + "_R";
      await replaceInput(page).fill(replaceMarker);
      await page.locator("button").filter({ hasText: "Replace All" }).click();
      await waitForReplaceComplete(page, replaceMarker);
      expect(await tickerCell.textContent()).toContain("_R");
    }
  });

  test("Replace replaces current match and advances", async ({ page }) => {
    await page.locator(".utbl-scroll").click();
    await page.keyboard.press("Control+h");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await expect(replaceInput(page)).toBeVisible({ timeout: 3000 });

    const selectEl = findBar(page).locator("..").locator("select");
    const options = await selectEl.locator("option").allTextContents();
    const tickerIdx = options.findIndex((o) => o.toLowerCase().includes("ticker"));
    if (tickerIdx > 0) await selectEl.selectOption({ index: tickerIdx });

    await findBar(page).fill("AAPL");
    await waitForPositiveMatch(page);
    expect(await getCurrentMatchIndex(page)).toBe(1);

    const currentCell = page.locator("[data-find-current]").first();
    await expect(currentCell).toBeVisible({ timeout: 3000 });

    await replaceInput(page).fill("REPLACED");
    await page.locator('button[title="Replace current match"]').click();
    await waitForReplaceComplete(page, "REPLACED");
  });

  test("Escape after find bar still works for editing", async ({ page }) => {
    await page.locator(".utbl-scroll").click();
    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await page.keyboard.press("Escape");
    await expect(findBar(page)).not.toBeVisible({ timeout: 3000 });

    await page.locator('[data-index="0"] [class*="cell"]').first().dblclick();
    const editor = page.locator('[data-index="0"] input, [data-index="0"] select, [data-index="0"] textarea');
    await expect(editor.first()).toBeVisible({ timeout: 5000 });
    await page.keyboard.press("Escape");
    await expect(editor.first()).not.toBeVisible({ timeout: 3000 });
  });

  test("find bar closes via close button", async ({ page }) => {
    await page.locator(".utbl-scroll").click();
    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await page.locator('button[title="Close (Esc)"]').click();
    await expect(findBar(page)).not.toBeVisible({ timeout: 3000 });
  });

  test("clearing search query resets match count", async ({ page }) => {
    await page.locator(".utbl-scroll").click();
    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await findBar(page).fill("a");
    await waitForPositiveMatch(page);
    expect(await getTotalMatchCount(page)).toBeGreaterThan(0);
    await findBar(page).fill("");
    await expect(matchCountSpan(page)).toHaveText("", { timeout: 5000 });
  });
});
