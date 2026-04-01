import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5176/unify-table/";

function waitForDuckDB(page: any) {
  return page.waitForFunction(
    () => {
      const root = document.getElementById("root");
      return root && root.innerHTML.length > 500 && !root.innerHTML.includes("INITIALIZING");
    },
    { timeout: 30000 },
  );
}

async function waitForTable(page: any) {
  await waitForDuckDB(page);
  await page.waitForTimeout(2000);
  await page.locator('[data-index="0"]').waitFor({ timeout: 10000 });
}

/** Get the active cell position by finding the element with the blue outline */
async function getActiveCellPosition(page: any): Promise<{ row: number; col: number } | null> {
  return page.evaluate(() => {
    const rows = document.querySelectorAll('[data-index]');
    for (const rowEl of rows) {
      const cells = rowEl.children;
      for (let colIdx = 0; colIdx < cells.length; colIdx++) {
        const el = cells[colIdx] as HTMLElement;
        const outline = el.style.outline || el.style.outlineColor || '';
        // Check for the blue outline (#3b82f6) used on active cells
        if (outline.includes('3b82f6') || outline.includes('rgb(59, 130, 246)')) {
          return { row: Number(rowEl.getAttribute('data-index')), col: colIdx };
        }
      }
    }
    return null;
  });
}

test.describe("Keyboard Navigation E2E", () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE + "plugins/editing");
    await waitForTable(page);
  });

  test("ArrowDown moves exactly one row at a time", async ({ page }) => {
    // Click first cell to activate
    const firstRow = page.locator('[data-index="0"]');
    await firstRow.locator('[class*="cell"]').first().click();
    await page.waitForTimeout(300);

    const positions: number[] = [];

    // Press ArrowDown 5 times and record row position each time
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(200);
      const pos = await getActiveCellPosition(page);
      positions.push(pos?.row ?? -1);
    }

    // Should be 1, 2, 3, 4, 5 (each exactly +1)
    for (let i = 0; i < positions.length; i++) {
      expect(positions[i]).toBe(i + 1);
    }
  });

  test("ArrowRight moves exactly one column at a time", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    await firstRow.locator('[class*="cell"]').first().click();
    await page.waitForTimeout(300);

    const positions: number[] = [];

    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(200);
      const pos = await getActiveCellPosition(page);
      positions.push(pos?.col ?? -1);
    }

    // Should be 1, 2, 3, 4
    for (let i = 0; i < positions.length; i++) {
      expect(positions[i]).toBe(i + 1);
    }
  });

  test("ArrowUp moves exactly one row at a time", async ({ page }) => {
    // Start at row 5
    const firstRow = page.locator('[data-index="0"]');
    await firstRow.locator('[class*="cell"]').first().click();
    await page.waitForTimeout(300);

    // Move down 5 rows first
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(200);

    const positions: number[] = [];
    // Now move up 5 rows
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(200);
      const pos = await getActiveCellPosition(page);
      positions.push(pos?.row ?? -1);
    }

    // Should be 4, 3, 2, 1, 0
    for (let i = 0; i < positions.length; i++) {
      expect(positions[i]).toBe(4 - i);
    }
  });

  test("ArrowLeft moves exactly one column at a time", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    // Click last cell (index 4)
    await firstRow.locator('[class*="cell"]').nth(4).click();
    await page.waitForTimeout(300);

    const positions: number[] = [];
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(200);
      const pos = await getActiveCellPosition(page);
      positions.push(pos?.col ?? -1);
    }

    // Should be 3, 2, 1, 0
    for (let i = 0; i < positions.length; i++) {
      expect(positions[i]).toBe(3 - i);
    }
  });

  test("navigation after edit commit stays consistent", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    const pnlCell = firstRow.locator('[class*="cell"]').nth(1);

    // Double-click to edit, then commit with Enter
    await pnlCell.dblclick();
    await page.waitForTimeout(500);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1500);

    // Now navigate down — should be 1 row per press
    const positions: number[] = [];
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(200);
      const pos = await getActiveCellPosition(page);
      positions.push(pos?.row ?? -1);
    }

    // After commit, activeCell stays on row 0, so ArrowDown goes to 1, 2, 3
    for (let i = 0; i < positions.length; i++) {
      expect(positions[i]).toBe(i + 1);
    }
  });
});
