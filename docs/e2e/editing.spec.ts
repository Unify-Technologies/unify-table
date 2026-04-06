import { test, expect } from "./fixtures";
import { freshNavigate, navigateSPA, waitForTable, waitForEditor, waitForEditorDismissed, waitForActiveCell } from "./helpers";

test.describe("Editing Plugin E2E", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await freshNavigate(page, "/plugins/editing");
    await waitForTable(page);
  });

  test("table renders with data rows", async ({ page }) => {
    const rows = page.locator("[data-index]");
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test("double-click cell enters edit mode and shows input", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    await firstRow.locator('[class*="cell"]').first().dblclick();
    await waitForEditor(page);
    const editor = page.locator('[data-index="0"] input, [data-index="0"] select, [data-index="0"] textarea');
    await expect(editor.first()).toBeVisible();
  });

  test("editing a cell does not cause row to jump position", async ({ page }) => {
    const getRowTexts = async () => {
      const rows = [];
      for (let i = 0; i < 5; i++) {
        const row = page.locator(`[data-index="${i}"]`);
        if ((await row.count()) === 0) break;
        rows.push(await row.locator('[class*="cell"]').first().textContent());
      }
      return rows;
    };

    const beforeEdit = await getRowTexts();
    const firstRow = page.locator('[data-index="0"]');
    await firstRow.locator('[class*="cell"]').first().dblclick();
    await waitForEditor(page);

    const select = firstRow.locator("select").first();
    if (await select.isVisible()) await select.selectOption("MSFT");
    await page.keyboard.press("Enter");
    await waitForEditorDismissed(page);

    const afterEdit = await getRowTexts();
    expect(afterEdit.length).toBe(beforeEdit.length);
    for (let i = 1; i < Math.min(beforeEdit.length, afterEdit.length); i++) {
      expect(afterEdit[i]).toBe(beforeEdit[i]);
    }
  });

  test("number editor does not show spinner arrows", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    await firstRow.locator('[class*="cell"]').nth(1).dblclick();
    const input = firstRow.locator("input").first();
    await expect(input).toBeVisible({ timeout: 5000 });
    expect(await input.getAttribute("type")).toBe("text");
    expect(await input.getAttribute("inputmode")).toBe("decimal");
  });

  test("Escape cancels editing and preserves original value", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    const firstCell = firstRow.locator('[class*="cell"]').first();
    const originalText = await firstCell.textContent();

    await firstCell.dblclick();
    await waitForEditor(page);
    await page.keyboard.press("Escape");
    await waitForEditorDismissed(page);

    expect(await firstRow.locator("input, select, textarea").count()).toBe(0);
    expect(await firstCell.textContent()).toBe(originalText);
  });

  test("keyboard Enter on active cell starts editing", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    await firstRow.locator('[class*="cell"]').first().click();
    await waitForActiveCell(page);
    await page.keyboard.press("Enter");
    await expect(firstRow.locator("input, select, textarea").first()).toBeVisible({ timeout: 5000 });
  });

  test("arrow keys move caret inside editor, not the active cell", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    await firstRow.locator('[class*="cell"]').nth(1).dblclick();
    const input = firstRow.locator("input").first();
    await expect(input).toBeVisible({ timeout: 5000 });
    await expect(input).toBeFocused();

    const initialValue = await input.inputValue();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");
    await expect(input).toBeFocused();
    expect(await input.inputValue()).toBe(initialValue);

    await page.keyboard.type("9");
    expect(await input.inputValue()).toContain("9");
    await page.keyboard.press("Escape");
  });

  test("caret is visible at end of value on edit start", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    await firstRow.locator('[class*="cell"]').nth(1).dblclick();
    const input = firstRow.locator("input").first();
    await expect(input).toBeVisible({ timeout: 5000 });

    const sel = await input.evaluate((el: HTMLInputElement) => ({
      start: el.selectionStart,
      end: el.selectionEnd,
      len: el.value.length,
    }));
    expect(sel.start).toBe(sel.len);
    expect(sel.end).toBe(sel.len);
    await page.keyboard.press("Escape");
  });

  test("clicking inside editor keeps focus", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    await firstRow.locator('[class*="cell"]').nth(1).dblclick();
    const input = firstRow.locator("input").first();
    await expect(input).toBeVisible({ timeout: 5000 });

    const box = await input.boundingBox();
    if (box) {
      await page.mouse.click(box.x + 5, box.y + box.height / 2);
      await expect(input).toBeFocused({ timeout: 2000 });
    }
    await page.keyboard.type("1");
    expect(await input.inputValue()).toContain("1");
    await page.keyboard.press("Escape");
  });

  test("text selection works inside editor via triple-click", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    await firstRow.locator('[class*="cell"]').nth(1).dblclick();
    const input = firstRow.locator("input").first();
    await expect(input).toBeVisible({ timeout: 5000 });

    const box = await input.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { clickCount: 3 });
      await page.waitForFunction(
        () => {
          const el = document.querySelector('[data-index="0"] input') as HTMLInputElement | null;
          return el && el.selectionStart === 0 && el.selectionEnd === el.value.length;
        },
        { timeout: 3000 },
      );
    }
    const sel = await input.evaluate((el: HTMLInputElement) => ({
      start: el.selectionStart,
      end: el.selectionEnd,
      len: el.value.length,
    }));
    expect(sel.start).toBe(0);
    expect(sel.end).toBe(sel.len);
    await page.keyboard.press("Escape");
  });

  test("keyboard navigation works after edit commit", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    await firstRow.locator('[class*="cell"]').nth(1).dblclick();
    await waitForEditor(page);
    await firstRow.locator("input").first().fill("999");
    await page.keyboard.press("Enter");
    await waitForEditorDismissed(page);

    await expect(page.locator('[tabindex="0"]').first()).toBeFocused({ timeout: 3000 });
    await page.keyboard.press("ArrowDown");
    await waitForActiveCell(page);
    await page.keyboard.press("Enter");
    await waitForEditor(page);
    await page.keyboard.press("Escape");
  });

  test("keyboard navigation works after click-away commit", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    const cells = firstRow.locator('[class*="cell"]');
    await cells.nth(1).dblclick();
    await waitForEditor(page);
    await firstRow.locator("input").first().fill("888");
    await cells.nth(0).click({ force: true });
    await waitForEditorDismissed(page);

    await page.keyboard.press("ArrowDown");
    await waitForActiveCell(page);
    await page.keyboard.press("ArrowDown");
    await waitForActiveCell(page);
    await page.keyboard.press("Enter");
    await waitForEditor(page);
    await page.keyboard.press("Escape");
  });

  test("edit numeric cell value persists correctly", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    await firstRow.locator('[class*="cell"]').nth(1).dblclick();
    await waitForEditor(page);
    await firstRow.locator("input").first().fill("12345.67");
    await page.keyboard.press("Enter");
    await waitForEditorDismissed(page);
    const newText = await firstRow.locator('[class*="cell"]').nth(1).textContent();
    expect(newText?.replace(/,/g, "")).toContain("12345.67");
  });
});

test.describe("Editing blocked without editing plugin", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await navigateSPA(page, "/plugins/selection");
    await waitForTable(page);
  });

  test("double-click does not open editor", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    const firstCell = firstRow.locator('[class*="cell"]').first();
    const originalText = await firstCell.textContent();
    await firstCell.dblclick();
    await expect(firstRow.locator("input, select, textarea")).toHaveCount(0);
    expect(await firstCell.textContent()).toBe(originalText);
  });

  test("Enter key does not open editor", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    await firstRow.locator('[class*="cell"]').first().click();
    await waitForActiveCell(page);
    await page.keyboard.press("Enter");
    await expect(firstRow.locator("input, select, textarea")).toHaveCount(0);
  });

  test("F2 key does not open editor", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    await firstRow.locator('[class*="cell"]').first().click();
    await waitForActiveCell(page);
    await page.keyboard.press("F2");
    await expect(firstRow.locator("input, select, textarea")).toHaveCount(0);
  });
});
