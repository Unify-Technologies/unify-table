import { test, expect } from "./fixtures";
import {
  navigateSPA,
  freshNavigate,
  waitForTable,
  waitForDuckDB,
  waitForGroupedTable,
  waitForRowCountChange,
  waitForDisplayContent,
} from "./helpers";

// ── Row Grouping ─────────────────────────────────────────────

test.describe("Row Grouping", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await freshNavigate(page, "/plugins/row-grouping");
    await waitForGroupedTable(page);
  });

  test("renders collapsed group rows with counts", async ({ page }) => {
    const rows = page.locator(".utbl-vrow");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    const groupHeader = page.locator('[data-field="__group__"]');
    expect(await groupHeader.count()).toBeGreaterThan(0);

    const toggles = page.locator('[role="button"][aria-label^="Toggle group"]');
    expect(await toggles.count()).toBeGreaterThan(0);

    const firstToggle = toggles.first();
    expect(await firstToggle.getAttribute("aria-expanded")).toBe("false");
  });

  test("expand top-level group shows sub-groups", async ({ page }) => {
    const rows = page.locator(".utbl-vrow");
    const initialCount = await rows.count();

    const firstToggle = page.locator('[role="button"][aria-label^="Toggle group"]').first();
    await firstToggle.click();
    await waitForRowCountChange(page, initialCount);

    const expandedCount = await rows.count();
    expect(expandedCount).toBeGreaterThan(initialCount);
    expect(await firstToggle.getAttribute("aria-expanded")).toBe("true");
  });

  test("collapse expanded group hides sub-groups", async ({ page }) => {
    const rows = page.locator(".utbl-vrow");
    const initialCount = await rows.count();

    const firstToggle = page.locator('[role="button"][aria-label^="Toggle group"]').first();
    await firstToggle.click();
    await waitForRowCountChange(page, initialCount);
    const expandedCount = await rows.count();

    await firstToggle.click();
    await waitForRowCountChange(page, expandedCount);
    const collapsedCount = await rows.count();

    expect(collapsedCount).toBeLessThan(expandedCount);
  });

  test("expand sub-group shows detail rows", async ({ page }) => {
    const rows = page.locator(".utbl-vrow");
    const initialCount = await rows.count();

    const firstToggle = page.locator('[role="button"][aria-label^="Toggle group"]').first();
    await firstToggle.click();
    await waitForRowCountChange(page, initialCount);
    const afterFirstExpand = await rows.count();

    const toggles = page.locator('[role="button"][aria-label^="Toggle group"]');
    const toggleCount = await toggles.count();
    if (toggleCount > 1) {
      await toggles.nth(1).click();
      await waitForRowCountChange(page, afterFirstExpand);
      const afterSecondExpand = await rows.count();
      expect(afterSecondExpand).toBeGreaterThan(afterFirstExpand);
    }
  });

});

// ── Selection ────────────────────────────────────────────────

test.describe("Selection", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await navigateSPA(page, "/plugins/selection");
    await waitForTable(page);
  });

  test("single click selects a cell with blue outline", async ({ page }) => {
    const firstCell = page.locator('[role="gridcell"]').first();
    await firstCell.click();

    const cell = page.locator('[role="gridcell"][aria-selected="true"]');
    await cell.first().waitFor({ timeout: 3000 });
    expect(await cell.count()).toBeGreaterThan(0);
  });

  test("shift+arrow creates range selection", async ({ page }) => {
    const grid = page.locator('[role="grid"]').first();
    const cells = grid.locator('[role="gridcell"]');
    await cells.first().click();
    await grid.locator('[role="gridcell"][aria-selected="true"]').first().waitFor({ timeout: 3000 });

    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.up("Shift");

    await page.waitForFunction(
      () => document.querySelectorAll('[role="gridcell"][aria-selected="true"]').length > 1,
      null,
      { timeout: 5000 },
    );
    const selectedCells = grid.locator('[role="gridcell"][aria-selected="true"]');
    expect(await selectedCells.count()).toBeGreaterThan(1);
  });
});

// ── Column Sorting ───────────────────────────────────────────

test.describe("Column Sorting", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await freshNavigate(page, "/table-basics");
    await waitForTable(page);
  });

  test("clicking header sorts column ascending then descending", async ({ page }) => {
    const header = page.locator('[role="columnheader"]').first();
    await header.click();
    await expect(header).toContainText("↑", { timeout: 5000 });

    await header.click();
    await expect(header).toContainText("↓", { timeout: 5000 });

    await header.click();
    await page.waitForFunction(
      () => {
        const h = document.querySelector('[role="columnheader"]');
        return h && !h.textContent?.includes("↑") && !h.textContent?.includes("↓");
      },
      null,
      { timeout: 5000 },
    );
  });
});

// ── Column Resize ────────────────────────────────────────────

test.describe("Column Resize", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await navigateSPA(page, "/plugins/column-resize");
    await waitForTable(page);
  });

  test("resize handles exist on column boundaries", async ({ page }) => {
    const resizeHandles = page.locator('[role="separator"][aria-orientation="vertical"]');
    expect(await resizeHandles.count()).toBeGreaterThan(0);
  });

  test("dragging resize handle changes column width", async ({ page }) => {
    const headers = page.locator('[role="columnheader"]');
    const firstHeader = headers.first();
    const initialWidth = await firstHeader.evaluate((el) => el.getBoundingClientRect().width);

    const resizeHandle = firstHeader.locator('[role="separator"]');
    if ((await resizeHandle.count()) > 0) {
      const box = await resizeHandle.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2);
        await page.mouse.up();

        await page.waitForFunction(
          (prevWidth) => {
            const h = document.querySelector('[role="columnheader"]');
            return h && h.getBoundingClientRect().width > prevWidth;
          },
          initialWidth,
          { timeout: 5000 },
        );
      }
    }
  });
});

// ── Filters ──────────────────────────────────────────────────

test.describe("Filters", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await navigateSPA(page, "/plugins/filters");
    await waitForTable(page);
  });

  test("table renders with data rows", async ({ page }) => {
    const rows = page.locator(".utbl-vrow");
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test("filter panel opens from toolbar", async ({ page }) => {
    const filterButton = page.locator('button[aria-label*="ilter"], [data-panel="filters"]');
    if ((await filterButton.count()) > 0) {
      await filterButton.first().click();
      const panel = page.locator(".utbl-panel, [class*='panel']");
      await panel.first().waitFor({ timeout: 5000 });
      expect(await panel.count()).toBeGreaterThan(0);
    }
  });
});

// ── Formatting ───────────────────────────────────────────────

test.describe("Formatting", () => {
  test.describe.configure({ mode: "serial" });

  test("conditional formatting applies colored styles to cells", async ({ page }) => {
    await navigateSPA(page, "/plugins/formatting");
    await waitForTable(page);

    const styledCells = page.locator('[role="gridcell"][style*="background"], [role="gridcell"][style*="color"]');
    await styledCells.first().waitFor({ timeout: 5000 });
    expect(await styledCells.count()).toBeGreaterThan(0);
  });
});

// ── Status Bar ───────────────────────────────────────────────

test.describe("Status Bar", () => {
  test.describe.configure({ mode: "serial" });

  test("footer shows aggregation stats on cell selection", async ({ page }) => {
    await navigateSPA(page, "/plugins/status-bar");
    await waitForTable(page);

    const footer = page.locator('[class*="footer"], .utbl-status-bar').first();
    await footer.waitFor({ timeout: 5000 });

    const cells = page.locator('[role="gridcell"]');
    if ((await cells.count()) > 5) {
      await cells.nth(1).click();
      await page.locator('[role="gridcell"][aria-selected="true"]').first().waitFor({ timeout: 3000 });
      await cells.nth(5).click({ modifiers: ["Shift"] });

      const footerText = await footer.textContent();
      expect(footerText?.length).toBeGreaterThan(0);
    }
  });
});

// ── Displays ─────────────────────────────────────────────────

test.describe("Displays", () => {
  test.describe.configure({ mode: "serial" });

  test("chart display renders an ECharts canvas", async ({ page }) => {
    await navigateSPA(page, "/displays/chart");
    await waitForDisplayContent(page);
    const canvas = page.locator("canvas");
    await canvas.first().waitFor({ timeout: 15000 });
    expect(await canvas.count()).toBeGreaterThan(0);
  });

  test("stats display renders content", async ({ page }) => {
    await navigateSPA(page, "/displays/stats");
    await waitForDuckDB(page);
    await page.locator("h1").first().waitFor({ timeout: 10000 });
    await page.waitForFunction(
      () => (document.querySelector("main, #root")?.textContent?.length ?? 0) > 200,
      null,
      { timeout: 15000 },
    );
  });

  test("pivot display renders a pivot table", async ({ page }) => {
    await navigateSPA(page, "/displays/pivot");
    await waitForDisplayContent(page);
    const pivotTable = page.locator(".utbl-pivot-table, table");
    await pivotTable.first().waitFor({ timeout: 15000 });
    expect(await pivotTable.count()).toBeGreaterThan(0);
  });

  test("summary display renders column profiles", async ({ page }) => {
    await navigateSPA(page, "/displays/summary");
    await waitForDisplayContent(page);
    const pageText = await page.locator("main, #root").first().textContent();
    expect(pageText?.length).toBeGreaterThan(200);
  });

  test("correlation display renders a heatmap", async ({ page }) => {
    await navigateSPA(page, "/displays/correlation");
    await waitForDisplayContent(page);
    const canvas = page.locator("canvas");
    await canvas.first().waitFor({ timeout: 15000 });
    expect(await canvas.count()).toBeGreaterThan(0);
  });

  test("timeline display renders a time chart", async ({ page }) => {
    await navigateSPA(page, "/displays/timeline");
    await waitForDisplayContent(page);
    const canvas = page.locator("canvas");
    await canvas.first().waitFor({ timeout: 15000 });
    expect(await canvas.count()).toBeGreaterThan(0);
  });

  test("outliers display renders outlier detection", async ({ page }) => {
    await navigateSPA(page, "/displays/outliers");
    await waitForDisplayContent(page);
    const content = page.locator("svg, table, canvas, [role='grid']");
    await content.first().waitFor({ timeout: 15000 });
    expect(await content.count()).toBeGreaterThan(0);
  });
});

// ── Formulas ─────────────────────────────────────────────────

test.describe("Formulas", () => {
  test.describe.configure({ mode: "serial" });

  test("formula columns render with sigma icon in header", async ({ page }) => {
    await navigateSPA(page, "/plugins/formulas");
    await waitForTable(page);

    const headersWithSvg = page.locator('[role="columnheader"]:has(svg)');
    await headersWithSvg.first().waitFor({ timeout: 5000 });
    expect(await headersWithSvg.count()).toBeGreaterThan(0);
  });

  test("formula columns display computed values", async ({ page }) => {
    await navigateSPA(page, "/plugins/formulas");
    await waitForTable(page);

    const rows = page.locator(".utbl-vrow");
    expect(await rows.count()).toBeGreaterThan(0);

    const cells = page.locator('[role="gridcell"]');
    const cellCount = await cells.count();
    let nonEmptyCells = 0;
    for (let i = 0; i < Math.min(20, cellCount); i++) {
      const text = await cells.nth(i).textContent();
      if (text && text.trim().length > 0) nonEmptyCells++;
    }
    expect(nonEmptyCells).toBeGreaterThan(0);
  });
});

// ── Column Pin ───────────────────────────────────────────────

test.describe("Column Pin", () => {
  test.describe.configure({ mode: "serial" });

  test("pinned columns have sticky positioning", async ({ page }) => {
    await navigateSPA(page, "/plugins/column-pin");
    await waitForTable(page);

    const stickyHeaders = page.locator('[role="columnheader"][style*="sticky"]');
    await stickyHeaders.first().waitFor({ timeout: 5000 });
    expect(await stickyHeaders.count()).toBeGreaterThan(0);
  });
});

// ── Presets ──────────────────────────────────────────────────

test.describe("Presets", () => {
  test.describe.configure({ mode: "serial" });

  test("spreadsheet preset renders a table with rows", async ({ page }) => {
    await navigateSPA(page, "/presets");
    await waitForTable(page);

    const rows = page.locator(".utbl-vrow");
    await rows.first().waitFor({ timeout: 15000 });
    expect(await rows.count()).toBeGreaterThan(0);
  });
});

// ── Density & Layout ─────────────────────────────────────────

test.describe("Density & Layout", () => {
  test.describe.configure({ mode: "serial" });

  test("density page shows grids", async ({ page }) => {
    await navigateSPA(page, "/density-layout");
    await waitForDuckDB(page);
    const grids = page.locator('[role="grid"]');
    await grids.first().waitFor({ timeout: 10000 });
    expect(await grids.count()).toBeGreaterThan(0);
  });
});

// ── Column Reorder ───────────────────────────────────────────

test.describe("Column Reorder", () => {
  test.describe.configure({ mode: "serial" });

  test("column headers are draggable", async ({ page }) => {
    await navigateSPA(page, "/plugins/column-reorder");
    await waitForTable(page);

    const headers = page.locator('[role="columnheader"]');
    expect(await headers.count()).toBeGreaterThan(1);
  });
});

// ── Table I/O ────────────────────────────────────────────────

test.describe("Table IO", () => {
  test.describe.configure({ mode: "serial" });

  test("table I/O page renders with data", async ({ page }) => {
    await navigateSPA(page, "/plugins/table-io");
    await waitForTable(page);

    const grid = page.locator('[role="grid"]');
    expect(await grid.count()).toBeGreaterThan(0);
  });
});

// ── Context Menu ─────────────────────────────────────────────

test.describe("Context Menu", () => {
  test.describe.configure({ mode: "serial" });

  test("right-click on cell opens context menu", async ({ page }) => {
    await navigateSPA(page, "/plugins/context-menu");
    await waitForTable(page);

    const row = page.locator(".utbl-vrow").first();
    await row.click({ button: "right" });

    await page.waitForFunction(
      () => {
        const divs = document.querySelectorAll("body > div");
        for (const d of divs) {
          const s = (d as HTMLElement).style;
          if (s.position === "fixed" && parseInt(s.zIndex) >= 9999) return true;
        }
        return false;
      },
      null,
      { timeout: 5000 },
    );
  });

});

// ── Clipboard ────────────────────────────────────────────────

test.describe("Clipboard", () => {
  test.describe.configure({ mode: "serial" });

  test("clipboard page renders with selection support", async ({ page }) => {
    await navigateSPA(page, "/plugins/clipboard");
    await waitForTable(page);

    const cell = page.locator('[role="gridcell"]').first();
    await cell.click();

    const selected = page.locator('[role="gridcell"][aria-selected="true"]');
    await selected.first().waitFor({ timeout: 3000 });
    expect(await selected.count()).toBeGreaterThan(0);
  });
});

// ── Headless / useTableContext ────────────────────────────────

test.describe("Headless", () => {
  test.describe.configure({ mode: "serial" });

  test("headless page renders content", async ({ page }) => {
    await navigateSPA(page, "/headless");
    await waitForDuckDB(page);
    await page.locator("h1").first().waitFor({ timeout: 10000 });
    const pageContent = await page.locator("main, [class*='content'], article").first().textContent();
    expect(pageContent?.length).toBeGreaterThan(100);
  });
});

// ── Panels ───────────────────────────────────────────────────

test.describe("Panels", () => {
  test.describe.configure({ mode: "serial" });

  test("panels page renders with panel controls", async ({ page }) => {
    await navigateSPA(page, "/panels");
    await waitForDuckDB(page);
    const grid = page.locator('[role="grid"]');
    await grid.first().waitFor({ timeout: 10000 });
    expect(await grid.count()).toBeGreaterThan(0);
  });
});
