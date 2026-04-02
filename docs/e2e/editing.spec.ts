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

test.describe("Editing Plugin E2E", () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE + "plugins/editing");
    await waitForTable(page);
  });

  test("table renders with data rows", async ({ page }) => {
    const rows = page.locator("[data-index]");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    await page.screenshot({ path: "e2e/screenshots/editing_01_table_loaded.png" });
  });

  test("double-click cell enters edit mode and shows input", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    const cells = firstRow.locator('[class*="cell"]');
    await cells.first().dblclick();

    const editor = page.locator('[data-index="0"] input, [data-index="0"] select, [data-index="0"] textarea');
    await expect(editor.first()).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: "e2e/screenshots/editing_02_edit_mode.png" });
  });

  test("editing a cell does not cause row to jump position", async ({ page }) => {
    // Read the first few row IDs (ticker values) before editing
    const getRowTexts = async () => {
      const rows = [];
      for (let i = 0; i < 5; i++) {
        const row = page.locator(`[data-index="${i}"]`);
        if (await row.count() === 0) break;
        const text = await row.locator('[class*="cell"]').first().textContent();
        rows.push(text);
      }
      return rows;
    };

    const beforeEdit = await getRowTexts();

    // Double-click the first cell (ticker, which is a select)
    const firstRow = page.locator('[data-index="0"]');
    const firstCell = firstRow.locator('[class*="cell"]').first();
    await firstCell.dblclick();
    await page.locator('[data-index] input, [data-index] select').first().waitFor({ timeout: 5000 });

    // Change value via select
    const select = firstRow.locator('select').first();
    if (await select.isVisible()) {
      await select.selectOption("MSFT");
    }
    await page.keyboard.press("Enter");
    await page.locator('[data-index] input, [data-index] select').waitFor({ state: 'detached', timeout: 5000 });

    const afterEdit = await getRowTexts();

    // The edited row should still be in the same position (index 0)
    // Other rows should not have shuffled
    expect(afterEdit.length).toBe(beforeEdit.length);
    // Row 0 might have changed value but rows 1-4 should be the same
    for (let i = 1; i < Math.min(beforeEdit.length, afterEdit.length); i++) {
      expect(afterEdit[i]).toBe(beforeEdit[i]);
    }
    await page.screenshot({ path: "e2e/screenshots/editing_03_no_row_jump.png" });
  });

  test("number editor does not show spinner arrows", async ({ page }) => {
    // PnL is the second column (index 1), editor: "number"
    const firstRow = page.locator('[data-index="0"]');
    const cells = firstRow.locator('[class*="cell"]');
    const pnlCell = cells.nth(1);

    await pnlCell.dblclick();

    // The input should be type="text" with inputMode="decimal", not type="number"
    const input = firstRow.locator('input').first();
    await expect(input).toBeVisible({ timeout: 5000 });
    const inputType = await input.getAttribute('type');
    expect(inputType).toBe('text'); // NOT 'number' — no spinner arrows
    const inputMode = await input.getAttribute('inputmode');
    expect(inputMode).toBe('decimal'); // mobile keyboard hint

    await page.screenshot({ path: "e2e/screenshots/editing_04_number_no_spinner.png" });
  });

  test("Escape cancels editing and preserves original value", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    const cells = firstRow.locator('[class*="cell"]');
    const firstCell = cells.first();
    const originalText = await firstCell.textContent();

    await firstCell.dblclick();
    await page.locator('[data-index] input, [data-index] select, [data-index] textarea').first().waitFor({ timeout: 5000 });
    await page.keyboard.press("Escape");
    await page.locator('[data-index] input, [data-index] select, [data-index] textarea').waitFor({ state: 'detached', timeout: 5000 });

    const editor = firstRow.locator('input, select, textarea');
    expect(await editor.count()).toBe(0);
    const afterEscape = await firstCell.textContent();
    expect(afterEscape).toBe(originalText);
  });

  test("keyboard Enter on active cell starts editing", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    const cells = firstRow.locator('[class*="cell"]');
    await cells.first().click();
    await page.waitForTimeout(200);
    await page.keyboard.press("Enter");

    const editor = firstRow.locator('input, select, textarea');
    await expect(editor.first()).toBeVisible({ timeout: 5000 });
  });

  test("arrow keys move caret inside editor, not the active cell", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    const pnlCell = firstRow.locator('[class*="cell"]').nth(1);

    // Double-click PnL to edit
    await pnlCell.dblclick();

    const input = firstRow.locator('input').first();
    await expect(input).toBeVisible({ timeout: 5000 });
    await expect(input).toBeFocused();

    const initialValue = await input.inputValue();

    // Press arrow keys — they should NOT navigate away from the input
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");

    // Input should still be focused (not lost to table navigation)
    await expect(input).toBeFocused();
    // Value should be unchanged (arrow keys didn't trigger cell move)
    const afterArrows = await input.inputValue();
    expect(afterArrows).toBe(initialValue);

    // Typing should append to the input, not be swallowed
    await page.keyboard.type("9");
    const afterType = await input.inputValue();
    expect(afterType).toContain("9");
    expect(afterType.length).toBe(initialValue.length + 1);

    await page.keyboard.press("Escape");
    await page.screenshot({ path: "e2e/screenshots/editing_06_caret_movement.png" });
  });

  test("caret is visible at end of value on edit start", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    const pnlCell = firstRow.locator('[class*="cell"]').nth(1);

    await pnlCell.dblclick();

    const input = firstRow.locator('input').first();
    await expect(input).toBeVisible({ timeout: 5000 });
    await expect(input).toBeFocused();

    // The selection should be collapsed (caret, not full selection)
    const selectionState = await input.evaluate((el: HTMLInputElement) => ({
      start: el.selectionStart,
      end: el.selectionEnd,
      length: el.value.length,
    }));

    // Caret at end, not selecting all
    expect(selectionState.start).toBe(selectionState.length);
    expect(selectionState.end).toBe(selectionState.length);
    expect(selectionState.start).toBe(selectionState.end); // collapsed = caret visible

    await page.keyboard.press("Escape");
  });

  test("clicking inside editor positions caret without losing focus", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    const pnlCell = firstRow.locator('[class*="cell"]').nth(1);

    // Double-click PnL to edit
    await pnlCell.dblclick();

    const input = firstRow.locator('input').first();
    await expect(input).toBeVisible({ timeout: 5000 });
    await expect(input).toBeFocused();

    // Click inside the input at a different position — focus should stay
    const box = await input.boundingBox();
    if (box) {
      // Click near the start of the input
      await page.mouse.click(box.x + 5, box.y + box.height / 2);
      await page.waitForTimeout(200);
    }

    // Input should still be focused (not stolen by container)
    await expect(input).toBeFocused();

    // Should be able to type at the clicked position
    await page.keyboard.type("1");
    const val = await input.inputValue();
    expect(val).toContain("1");
    await page.keyboard.press("Escape");
  });

  test("text selection works inside editor via mouse drag", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    const pnlCell = firstRow.locator('[class*="cell"]').nth(1);

    await pnlCell.dblclick();

    const input = firstRow.locator('input').first();
    await expect(input).toBeVisible({ timeout: 5000 });
    await expect(input).toBeFocused();

    // Triple-click to select all (more reliable than Ctrl+A for inputs)
    const box = await input.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { clickCount: 3 });
      await page.waitForTimeout(200);
    }

    const selState = await input.evaluate((el: HTMLInputElement) => ({
      start: el.selectionStart,
      end: el.selectionEnd,
      len: el.value.length,
    }));

    // All text should be selected
    expect(selState.start).toBe(0);
    expect(selState.end).toBe(selState.len);

    await page.keyboard.press("Escape");
  });

  test("keyboard navigation works on edited cell after commit", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    const cells = firstRow.locator('[class*="cell"]');
    const pnlCell = cells.nth(1); // PnL column

    // Double-click to edit
    await pnlCell.dblclick();
    await page.locator('[data-index] input, [data-index] select').first().waitFor({ timeout: 5000 });

    // Type a value and commit with Enter
    const input = firstRow.locator('input').first();
    await input.fill("999");
    await page.keyboard.press("Enter");
    await page.locator('[data-index] input, [data-index] select').waitFor({ state: 'detached', timeout: 5000 });

    // The editor should be gone
    const editors = firstRow.locator('input, select, textarea');
    expect(await editors.count()).toBe(0);

    // The scroll container should have focus for keyboard events
    const container = page.locator('[tabindex="0"]').first();
    await expect(container).toBeFocused({ timeout: 3000 });

    // Arrow down should move the active cell
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(
      () => {
        const cells = document.querySelectorAll('[data-index] > div');
        for (const cell of cells) {
          if ((cell as HTMLElement).style.outline?.includes('3b82f6')) return true;
        }
        return false;
      },
      { timeout: 3000 },
    );

    // Take screenshot to see if active cell moved to row 1
    await page.screenshot({ path: "e2e/screenshots/editing_07_nav_after_edit.png" });

    // Press Enter to start editing the new active cell
    await page.keyboard.press("Enter");

    // An editor should appear (active cell moved down one row)
    const anyEditor = page.locator('[data-index] input, [data-index] select, [data-index] textarea');
    await expect(anyEditor.first()).toBeVisible({ timeout: 5000 });

    await page.keyboard.press("Escape");
    await page.screenshot({ path: "e2e/screenshots/editing_07_nav_after_edit.png" });
  });

  test("keyboard navigation works after click-away commit", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    const cells = firstRow.locator('[class*="cell"]');
    const pnlCell = cells.nth(1);

    // Double-click to edit
    await pnlCell.dblclick();
    await page.locator('[data-index] input, [data-index] select').first().waitFor({ timeout: 5000 });

    const input = firstRow.locator('input').first();
    await input.fill("888");

    // Click away to a different cell to commit via blur
    const tickerCell = cells.nth(0);
    await tickerCell.click({ force: true });
    await page.locator('[data-index] input, [data-index] select').waitFor({ state: 'detached', timeout: 5000 });

    // Arrow keys should navigate
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(
      () => {
        const cells = document.querySelectorAll('[data-index] > div');
        for (const cell of cells) {
          if ((cell as HTMLElement).style.outline?.includes('3b82f6')) return true;
        }
        return false;
      },
      { timeout: 3000 },
    );
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(
      () => {
        const cells = document.querySelectorAll('[data-index] > div');
        for (const cell of cells) {
          if ((cell as HTMLElement).style.outline?.includes('3b82f6')) return true;
        }
        return false;
      },
      { timeout: 3000 },
    );

    // Should be able to enter edit mode on the new cell
    await page.keyboard.press("Enter");

    const activeRowEditor = page.locator('[data-index] input, [data-index] select, [data-index] textarea');
    await expect(activeRowEditor.first()).toBeVisible({ timeout: 5000 });

    await page.keyboard.press("Escape");
    await page.screenshot({ path: "e2e/screenshots/editing_08_nav_after_clickaway.png" });
  });

  test("edit numeric cell value persists correctly", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    const cells = firstRow.locator('[class*="cell"]');
    const pnlCell = cells.nth(1);

    // Double-click PnL cell
    await pnlCell.dblclick();
    await page.locator('[data-index] input, [data-index] select').first().waitFor({ timeout: 5000 });

    const input = firstRow.locator('input').first();
    await input.fill("12345.67");
    await page.keyboard.press("Enter");
    await page.locator('[data-index] input, [data-index] select').waitFor({ state: 'detached', timeout: 5000 });

    // The cell should show the new value
    const newText = await cells.nth(1).textContent();
    // Value may be locale-formatted (e.g., "12,345.67")
    expect(newText?.replace(/,/g, '')).toContain("12345.67");
    await page.screenshot({ path: "e2e/screenshots/editing_05_numeric_edit.png" });
  });
});

test.describe("Editing blocked without editing plugin", () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    // Selection page has no editing plugin
    await page.goto(BASE + "plugins/selection");
    await waitForTable(page);
  });

  test("double-click does not open an editor when editing plugin is absent", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    const cells = firstRow.locator('[class*="cell"]');
    const originalText = await cells.first().textContent();

    await cells.first().dblclick();
    await page.waitForTimeout(200);

    const editor = firstRow.locator('input, select, textarea');
    expect(await editor.count()).toBe(0);

    const afterText = await cells.first().textContent();
    expect(afterText).toBe(originalText);
  });

  test("Enter key does not open an editor when editing plugin is absent", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    const cells = firstRow.locator('[class*="cell"]');

    await cells.first().click();
    await page.waitForTimeout(200);

    await page.keyboard.press("Enter");
    await page.waitForTimeout(200);

    const editor = firstRow.locator('input, select, textarea');
    expect(await editor.count()).toBe(0);
  });

  test("F2 does not open an editor when editing plugin is absent", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    const cells = firstRow.locator('[class*="cell"]');

    await cells.first().click();
    await page.waitForTimeout(200);

    await page.keyboard.press("F2");
    await page.waitForTimeout(200);

    const editor = firstRow.locator('input, select, textarea');
    expect(await editor.count()).toBe(0);
  });
});
