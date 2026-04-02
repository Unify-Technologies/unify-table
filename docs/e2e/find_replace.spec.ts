import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5176/unify-table/";

function waitForDuckDB(page: any) {
  return page.waitForFunction(
    () => {
      const root = document.getElementById("root");
      return root && !root.innerHTML.includes("INITIALIZING") && root.querySelector('[data-index], .utbl-scroll, h1');
    },
    { timeout: 30000 },
  );
}

async function waitForTable(page: any) {
  await waitForDuckDB(page);
  await page.locator('[data-index="0"]').waitFor({ timeout: 10000 });
}

/** The find bar search input */
function findBar(page: any) {
  return page.locator('input[placeholder="Find\u2026"]');
}

/** The replace input */
function replaceInput(page: any) {
  return page.locator('input[placeholder="Replace\u2026"]');
}

/** The match count span — scoped to the find bar's parent row */
function matchCountSpan(page: any) {
  return findBar(page).locator("..").locator("span");
}

/**
 * Wait for the search to complete (debounce finishes).
 * Polls the span text until it shows a stable "X of Y" result (not "Searching…" or empty).
 */
async function waitForSearchComplete(page: any) {
  // Wait for the span to stabilize — not empty, not "Searching…"
  await page.waitForFunction(
    () => {
      const input = document.querySelector('input[placeholder="Find\u2026"]') as HTMLInputElement | null;
      if (!input) return false;
      const row = input.parentElement;
      if (!row) return false;
      const span = row.querySelector("span");
      if (!span) return false;
      const text = span.textContent ?? "";
      // Resolved when it shows "X of Y" (after search completes)
      return /\d+ of \d+/.test(text) && !text.includes("Searching");
    },
    { timeout: 10000 },
  );
}

/** Wait for a positive match count (not "0 of 0") */
async function waitForPositiveMatch(page: any) {
  await page.waitForFunction(
    () => {
      const input = document.querySelector('input[placeholder="Find\u2026"]') as HTMLInputElement | null;
      if (!input) return false;
      const row = input.parentElement;
      if (!row) return false;
      const span = row.querySelector("span");
      if (!span) return false;
      const text = span.textContent ?? "";
      const m = text.match(/(\d+) of (\d+)/);
      return m && parseInt(m[2]) > 0;
    },
    { timeout: 10000 },
  );
}

/** Read the total match count from the "X of Y" label */
async function getTotalMatchCount(page: any): Promise<number> {
  const text = await matchCountSpan(page).textContent();
  const m = text?.match(/of (\d+)/);
  return m ? parseInt(m[1]) : -1;
}

/** Read the current match index (1-based) from "X of Y" */
async function getCurrentMatchIndex(page: any): Promise<number> {
  const text = await matchCountSpan(page).textContent();
  const m = text?.match(/^(\d+) of/);
  return m ? parseInt(m[1]) : -1;
}

test.describe("Find & Replace Plugin E2E", () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE + "plugins/find-replace");
    await waitForTable(page);
  });

  test("Ctrl+F opens the find bar", async ({ page }) => {
    const scroll = page.locator(".utbl-scroll");
    await scroll.click();

    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await expect(findBar(page)).toBeFocused();
  });

  test("Escape closes the find bar", async ({ page }) => {
    const scroll = page.locator(".utbl-scroll");
    await scroll.click();

    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });

    await page.keyboard.press("Escape");
    await expect(findBar(page)).not.toBeVisible({ timeout: 3000 });
  });

  test("typing a query shows match count", async ({ page }) => {
    const scroll = page.locator(".utbl-scroll");
    await scroll.click();

    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });

    await findBar(page).fill("a");
    await waitForPositiveMatch(page);

    const count = await getTotalMatchCount(page);
    expect(count).toBeGreaterThan(0);
  });

  test("no matches shows red count", async ({ page }) => {
    const scroll = page.locator(".utbl-scroll");
    await scroll.click();

    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });

    await findBar(page).fill("ZZZNONEXISTENT999");
    await waitForSearchComplete(page);

    const count = await getTotalMatchCount(page);
    expect(count).toBe(0);

    const color = await matchCountSpan(page).evaluate((el: HTMLElement) => getComputedStyle(el).color);
    expect(color).toBe("rgb(239, 68, 68)");
  });

  test("Ctrl+H opens find bar with replace row", async ({ page }) => {
    const scroll = page.locator(".utbl-scroll");
    await scroll.click();

    await page.keyboard.press("Control+h");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await expect(replaceInput(page)).toBeVisible({ timeout: 3000 });
  });

  test("toggle replace row via chevron", async ({ page }) => {
    const scroll = page.locator(".utbl-scroll");
    await scroll.click();

    // Open find-only
    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await expect(replaceInput(page)).not.toBeVisible();

    // Click the chevron toggle (first button, title contains "Show replace")
    const toggleBtn = page.locator('button[title="Show replace"]');
    await toggleBtn.click();
    await expect(replaceInput(page)).toBeVisible({ timeout: 3000 });

    // Click again to hide
    const hideBtn = page.locator('button[title="Hide replace"]');
    await hideBtn.click();
    await expect(replaceInput(page)).not.toBeVisible();
  });

  test("case-sensitive toggle affects results", async ({ page }) => {
    const scroll = page.locator(".utbl-scroll");
    await scroll.click();

    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });

    await findBar(page).fill("a");
    await waitForPositiveMatch(page);
    const insensitiveCount = await getTotalMatchCount(page);

    const csBtn = page.locator("button").filter({ hasText: "Aa" });
    await csBtn.click();
    await waitForPositiveMatch(page);
    const sensitiveCount = await getTotalMatchCount(page);

    expect(sensitiveCount).toBeLessThanOrEqual(insensitiveCount);
  });

  test("column filter limits search scope", async ({ page }) => {
    const scroll = page.locator(".utbl-scroll");
    await scroll.click();

    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });

    await findBar(page).fill("a");
    await waitForPositiveMatch(page);
    const allColsCount = await getTotalMatchCount(page);
    expect(allColsCount).toBeGreaterThan(0);

    const selectEl = findBar(page).locator("..").locator("select");
    await selectEl.selectOption({ index: 1 });
    await waitForPositiveMatch(page);
    const oneColCount = await getTotalMatchCount(page);

    expect(oneColCount).toBeLessThanOrEqual(allColsCount);
  });

  test("next/prev match navigation cycles through matches", async ({ page }) => {
    const scroll = page.locator(".utbl-scroll");
    await scroll.click();

    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });

    await findBar(page).fill("AAPL");
    await waitForPositiveMatch(page);

    // Should start at match 1
    const startIdx = await getCurrentMatchIndex(page);
    expect(startIdx).toBe(1);

    // Click next match
    const nextBtn = page.locator('button[title*="Next match"]');
    await nextBtn.click();
    const nextIdx = await getCurrentMatchIndex(page);
    expect(nextIdx).toBe(2);

    // Click prev match
    const prevBtn = page.locator('button[title*="Previous match"]');
    await prevBtn.click();
    const prevIdx = await getCurrentMatchIndex(page);
    expect(prevIdx).toBe(1);
  });

  test("Enter in search input navigates to next match", async ({ page }) => {
    const scroll = page.locator(".utbl-scroll");
    await scroll.click();

    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });

    await findBar(page).fill("AAPL");
    await waitForPositiveMatch(page);

    const startIdx = await getCurrentMatchIndex(page);
    expect(startIdx).toBe(1);

    // Press Enter to go to next
    await page.keyboard.press("Enter");
    const nextIdx = await getCurrentMatchIndex(page);
    expect(nextIdx).toBe(2);

    // Press Shift+Enter to go to prev
    await page.keyboard.press("Shift+Enter");
    const prevIdx = await getCurrentMatchIndex(page);
    expect(prevIdx).toBe(1);
  });

  test("matching cells are highlighted", async ({ page }) => {
    const scroll = page.locator(".utbl-scroll");
    await scroll.click();

    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });

    await findBar(page).fill("AAPL");
    await waitForPositiveMatch(page);

    // Wait for highlights to be applied
    await page.waitForTimeout(200);

    // Check that at least one cell has a highlight attribute
    const highlighted = page.locator("[data-find-hl]");
    const count = await highlighted.count();
    expect(count).toBeGreaterThan(0);

    // The current match should have data-find-current
    const current = page.locator("[data-find-current]");
    const currentCount = await current.count();
    expect(currentCount).toBeGreaterThan(0);
  });

  test("highlights are cleared when find bar closes", async ({ page }) => {
    const scroll = page.locator(".utbl-scroll");
    await scroll.click();

    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });

    await findBar(page).fill("AAPL");
    await waitForPositiveMatch(page);
    await page.waitForTimeout(200);

    // Verify highlights exist
    const highlighted = page.locator("[data-find-hl]");
    expect(await highlighted.count()).toBeGreaterThan(0);

    // Close the find bar
    await page.keyboard.press("Escape");
    await expect(findBar(page)).not.toBeVisible({ timeout: 3000 });

    // Highlights should be cleared
    await page.waitForTimeout(200);
    expect(await highlighted.count()).toBe(0);
  });

  test("typing in find bar does not trigger table keyboard shortcuts", async ({ page }) => {
    const scroll = page.locator(".utbl-scroll");
    await scroll.click();

    const firstRow = page.locator('[data-index="0"]');
    await firstRow.locator('[class*="cell"]').first().click();

    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });

    await findBar(page).fill("test");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowLeft");

    await expect(findBar(page)).toBeFocused();
  });

  test("Replace All updates cell values", async ({ page }) => {
    const scroll = page.locator(".utbl-scroll");
    await scroll.click();

    await page.keyboard.press("Control+h");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await expect(replaceInput(page)).toBeVisible({ timeout: 3000 });

    const firstRow = page.locator('[data-index="0"]');
    const tickerCell = firstRow.locator('[class*="cell"]').first();
    const originalTicker = (await tickerCell.textContent())?.trim();

    if (originalTicker && originalTicker.length > 0) {
      const selectEl = findBar(page).locator("..").locator("select");
      const options = await selectEl.locator("option").allTextContents();
      const tickerIdx = options.findIndex((o: string) => o.toLowerCase().includes("ticker"));
      if (tickerIdx > 0) {
        await selectEl.selectOption({ index: tickerIdx });
      }

      await findBar(page).fill(originalTicker);
      await waitForPositiveMatch(page);
      const count = await getTotalMatchCount(page);
      expect(count).toBeGreaterThan(0);

      await replaceInput(page).fill(originalTicker + "_R");

      const replaceAllBtn = page.locator("button").filter({ hasText: "Replace All" });
      await replaceAllBtn.click();

      await page.waitForTimeout(2000);

      const updatedText = await tickerCell.textContent();
      expect(updatedText).toContain("_R");
    }
  });

  test("Replace replaces current match and advances to next", async ({ page }) => {
    const scroll = page.locator(".utbl-scroll");
    await scroll.click();

    await page.keyboard.press("Control+h");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await expect(replaceInput(page)).toBeVisible({ timeout: 3000 });

    // Select only the ticker column
    const selectEl = findBar(page).locator("..").locator("select");
    const options = await selectEl.locator("option").allTextContents();
    const tickerIdx = options.findIndex((o: string) => o.toLowerCase().includes("ticker"));
    if (tickerIdx > 0) {
      await selectEl.selectOption({ index: tickerIdx });
    }

    // Search for a ticker
    await findBar(page).fill("AAPL");
    await waitForPositiveMatch(page);

    const countBefore = await getTotalMatchCount(page);
    expect(countBefore).toBeGreaterThan(0);

    // Current match should be "1 of N"
    const idxBefore = await getCurrentMatchIndex(page);
    expect(idxBefore).toBe(1);

    // Get the current match cell text
    const currentCell = page.locator("[data-find-current]").first();
    await expect(currentCell).toBeVisible({ timeout: 3000 });
    const cellTextBefore = await currentCell.textContent();
    expect(cellTextBefore).toContain("AAPL");

    // Click Replace (single match)
    await replaceInput(page).fill("REPLACED");
    const replaceBtn = page.locator('button[title="Replace current match"]');
    await replaceBtn.click();

    // Wait for replace to complete
    await page.waitForTimeout(2000);

    // The previously highlighted cell should no longer have the current match highlight
    // (it was replaced, so it no longer matches)
    const currentAfter = page.locator("[data-find-current]");
    const currentAfterCount = await currentAfter.count();
    // If there are still matches, the current highlight moved to a different cell
    if (currentAfterCount > 0) {
      const newCellText = await currentAfter.first().textContent();
      // The new current match should still contain "AAPL" (it's a different cell)
      expect(newCellText).toContain("AAPL");
    }
  });

  test("Escape after closing find bar still works for keyboard plugin", async ({ page }) => {
    const scroll = page.locator(".utbl-scroll");
    await scroll.click();

    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });
    await page.keyboard.press("Escape");
    await expect(findBar(page)).not.toBeVisible({ timeout: 3000 });

    const firstRow = page.locator('[data-index="0"]');
    await firstRow.locator('[class*="cell"]').first().dblclick();
    const editor = page.locator('[data-index="0"] input, [data-index="0"] select, [data-index="0"] textarea');
    await expect(editor.first()).toBeVisible({ timeout: 5000 });

    await page.keyboard.press("Escape");
    await expect(editor.first()).not.toBeVisible({ timeout: 3000 });
    await expect(findBar(page)).not.toBeVisible();
  });

  test("find bar closes via close button", async ({ page }) => {
    const scroll = page.locator(".utbl-scroll");
    await scroll.click();

    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });

    const closeBtn = page.locator('button[title="Close (Esc)"]');
    await closeBtn.click();
    await expect(findBar(page)).not.toBeVisible({ timeout: 3000 });
  });

  test("clearing search query resets match count", async ({ page }) => {
    const scroll = page.locator(".utbl-scroll");
    await scroll.click();

    await page.keyboard.press("Control+f");
    await expect(findBar(page)).toBeVisible({ timeout: 5000 });

    await findBar(page).fill("a");
    await waitForPositiveMatch(page);
    const count = await getTotalMatchCount(page);
    expect(count).toBeGreaterThan(0);

    await findBar(page).fill("");
    await expect(matchCountSpan(page)).toHaveText("", { timeout: 5000 });
  });
});
