import { test, expect } from "./fixtures";
import { navigateSPA, waitForTable, waitForActiveCell, getActiveCellPosition } from "./helpers";

test.describe("Keyboard Navigation E2E", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await navigateSPA(page, "/plugins/editing");
    await waitForTable(page);
  });

  test("ArrowDown moves exactly one row at a time", async ({ page }) => {
    await page.locator('[data-index="0"] [class*="cell"]').first().click();
    await waitForActiveCell(page);

    const positions: number[] = [];
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowDown");
      await waitForActiveCell(page);
      const pos = await getActiveCellPosition(page);
      positions.push(pos?.row ?? -1);
    }
    for (let i = 0; i < positions.length; i++) expect(positions[i]).toBe(i + 1);
  });

  test("ArrowRight moves exactly one column at a time", async ({ page }) => {
    await page.locator('[data-index="0"] [class*="cell"]').first().click();
    await waitForActiveCell(page);

    const positions: number[] = [];
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("ArrowRight");
      await waitForActiveCell(page);
      const pos = await getActiveCellPosition(page);
      positions.push(pos?.col ?? -1);
    }
    for (let i = 0; i < positions.length; i++) expect(positions[i]).toBe(i + 1);
  });

  test("ArrowUp moves exactly one row at a time", async ({ page }) => {
    await page.locator('[data-index="0"] [class*="cell"]').first().click();
    await waitForActiveCell(page);
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowDown");
      await waitForActiveCell(page);
    }

    const positions: number[] = [];
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowUp");
      await waitForActiveCell(page);
      const pos = await getActiveCellPosition(page);
      positions.push(pos?.row ?? -1);
    }
    for (let i = 0; i < positions.length; i++) expect(positions[i]).toBe(4 - i);
  });

  test("ArrowLeft moves exactly one column at a time", async ({ page }) => {
    await page.locator('[data-index="0"] [class*="cell"]').nth(4).click();
    await waitForActiveCell(page);

    const positions: number[] = [];
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("ArrowLeft");
      await waitForActiveCell(page);
      const pos = await getActiveCellPosition(page);
      positions.push(pos?.col ?? -1);
    }
    for (let i = 0; i < positions.length; i++) expect(positions[i]).toBe(3 - i);
  });

  test("navigation after edit commit stays consistent", async ({ page }) => {
    const firstRow = page.locator('[data-index="0"]');
    await firstRow.locator('[class*="cell"]').nth(1).dblclick();
    await page.locator("[data-index] input, [data-index] select").first().waitFor({ timeout: 5000 });
    await page.keyboard.press("Enter");
    await page.locator("[data-index] input, [data-index] select").waitFor({ state: "detached", timeout: 5000 });

    const positions: number[] = [];
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("ArrowDown");
      await waitForActiveCell(page);
      const pos = await getActiveCellPosition(page);
      positions.push(pos?.row ?? -1);
    }
    for (let i = 0; i < positions.length; i++) expect(positions[i]).toBe(i + 1);
  });
});
