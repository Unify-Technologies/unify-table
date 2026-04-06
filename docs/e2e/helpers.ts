import type { Page } from "@playwright/test";

// ── Navigation ──────────────────────────────────────────────

/** Client-side SPA navigation — no page reload, DuckDB stays alive. */
export async function navigateSPA(page: Page, path: string) {
  await page.evaluate((p) => {
    window.history.pushState(null, "", "/unify-table" + p);
    window.dispatchEvent(new PopStateEvent("popstate"));
    const el = document.getElementById("doc-content");
    if (el) el.scrollTop = 0;
    else window.scrollTo(0, 0);
  }, path);
}

/** Navigate away then back to force React unmount/remount (resets component state). */
export async function freshNavigate(page: Page, path: string) {
  const intermediate = path === "/" ? "/getting-started" : "/";
  await navigateSPA(page, intermediate);
  await navigateSPA(page, path);
}

// ── General waits ───────────────────────────────────────────

export function waitForDuckDB(page: Page, timeout = 30000) {
  return page.waitForFunction(
    () => {
      const root = document.getElementById("root");
      return root && !root.innerHTML.includes("INITIALIZING") && root.querySelector("[data-index], .utbl-scroll, h1");
    },
    null,
    { timeout },
  );
}

export async function waitForTable(page: Page) {
  await waitForDuckDB(page);
  await page.locator('[data-index="0"], .utbl-vrow, .utbl-scroll').first().waitFor({ timeout: 15000 });
}

export async function waitForContent(page: Page) {
  await page.locator('[data-index="0"], h1, .utbl-scroll').first().waitFor({ timeout: 10000 });
}

// ── Theme ───────────────────────────────────────────────────

export async function ensureDarkTheme(page: Page) {
  const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  if (!isDark) {
    await page.locator("header button").last().click();
    await page.waitForFunction(() => document.documentElement.classList.contains("dark"), { timeout: 5000 });
  }
}

export async function toggleToLight(page: Page) {
  const toggleBtn = page.locator("header button").last();
  const hadDark = (await page.locator('[class*="utbl-dark-"]').count()) > 0;
  await toggleBtn.click();
  if (hadDark) {
    await page.locator('[class*="utbl-light-"]').first().waitFor({ timeout: 5000 }).catch(() => {});
  }
}

export async function toggleTheme(page: Page) {
  const toggleBtn = page.locator("header button").last();
  const currentClasses = (await page.locator('[class*="utbl-dark-"], [class*="utbl-light-"]').first().getAttribute("class")) ?? "";
  const wasDark = currentClasses.includes("utbl-dark-");
  await toggleBtn.click();
  const newPrefix = wasDark ? "utbl-light-" : "utbl-dark-";
  await page.locator(`[class*="${newPrefix}"]`).first().waitFor({ timeout: 5000 });
}

export async function assertTheme(page: Page, expected: "dark" | "light") {
  const { expect } = await import("@playwright/test");
  const opposite = expected === "dark" ? "light" : "dark";

  const containers = page.locator(`[class*="utbl-${expected}-container"]`);
  const cells = page.locator(`[class*="utbl-${expected}-cell"]`);
  const headers = page.locator(`[class*="utbl-${expected}-header"]`);
  const oppositeContainers = page.locator(`[class*="utbl-${opposite}-container"]`);
  const oppositeCells = page.locator(`[class*="utbl-${opposite}-cell"]`);
  const oppositeHeaders = page.locator(`[class*="utbl-${opposite}-header"]`);

  const containerCount = await containers.count();
  const cellCount = await cells.count();
  const headerCount = await headers.count();
  expect(containerCount + cellCount + headerCount).toBeGreaterThan(0);
  expect((await oppositeContainers.count()) + (await oppositeCells.count()) + (await oppositeHeaders.count())).toBe(0);
}

// ── Row Grouping ────────────────────────────────────────────

export async function waitForGroupedTable(page: Page) {
  await waitForTable(page);
  await page.locator('[role="button"][aria-label^="Toggle group"]').first().waitFor({ timeout: 10000 });
  await page.waitForFunction(
    () => {
      const count = document.querySelectorAll(".utbl-vrow").length;
      (window as any).__lastRowCount = (window as any).__lastRowCount ?? count;
      (window as any).__stableTime = (window as any).__stableTime ?? Date.now();
      if (count !== (window as any).__lastRowCount) {
        (window as any).__lastRowCount = count;
        (window as any).__stableTime = Date.now();
      }
      return Date.now() - (window as any).__stableTime > 500;
    },
    null,
    { timeout: 15000 },
  );
}

export async function waitForRowCountChange(page: Page, previousCount: number) {
  await page.waitForFunction((prev) => document.querySelectorAll(".utbl-vrow").length !== prev, previousCount, { timeout: 10000 });
}

// ── Displays ────────────────────────────────────────────────

export async function waitForDisplayContent(page: Page) {
  await waitForDuckDB(page);
  await page.locator("canvas, .utbl-pivot-table, .utbl-display-loading, [role='grid']").first().waitFor({ timeout: 20000 });
  const loading = page.locator(".utbl-display-loading");
  if ((await loading.count()) > 0) {
    await loading.waitFor({ state: "detached", timeout: 20000 }).catch(() => {});
  }
}

// ── Editing ─────────────────────────────────────────────────

export async function waitForEditor(page: Page) {
  await page.locator("[data-index] input, [data-index] select, [data-index] textarea").first().waitFor({ timeout: 5000 });
}

export async function waitForEditorDismissed(page: Page) {
  await page.locator("[data-index] input, [data-index] select, [data-index] textarea").waitFor({ state: "detached", timeout: 5000 });
}

export async function waitForActiveCell(page: Page) {
  await page.locator('[role="gridcell"][aria-selected="true"], [data-index] > div[style*="3b82f6"]').first().waitFor({ timeout: 5000 });
}

export async function getActiveCellPosition(page: Page): Promise<{ row: number; col: number } | null> {
  return page.evaluate(() => {
    const rows = document.querySelectorAll("[data-index]");
    for (const rowEl of rows) {
      const cells = rowEl.children;
      for (let colIdx = 0; colIdx < cells.length; colIdx++) {
        const el = cells[colIdx] as HTMLElement;
        const outline = el.style.outline || el.style.outlineColor || "";
        if (outline.includes("3b82f6") || outline.includes("rgb(59, 130, 246)")) {
          return { row: Number(rowEl.getAttribute("data-index")), col: colIdx };
        }
      }
    }
    return null;
  });
}

// ── Find & Replace ──────────────────────────────────────────

export function findBar(page: Page) {
  return page.locator('input[placeholder="Find\u2026"]');
}

export function replaceInput(page: Page) {
  return page.locator('input[placeholder="Replace\u2026"]');
}

export function matchCountSpan(page: Page) {
  return findBar(page).locator("..").locator("span");
}

export async function waitForSearchComplete(page: Page) {
  await page.waitForFunction(
    () => {
      const input = document.querySelector('input[placeholder="Find\u2026"]') as HTMLInputElement | null;
      if (!input) return false;
      const span = input.parentElement?.querySelector("span");
      if (!span) return false;
      return /\d+ of \d+/.test(span.textContent ?? "") && !span.textContent?.includes("Searching");
    },
    { timeout: 10000 },
  );
}

export async function waitForPositiveMatch(page: Page) {
  await page.waitForFunction(
    () => {
      const input = document.querySelector('input[placeholder="Find\u2026"]') as HTMLInputElement | null;
      if (!input) return false;
      const span = input.parentElement?.querySelector("span");
      if (!span) return false;
      const m = (span.textContent ?? "").match(/(\d+) of (\d+)/);
      return m && parseInt(m[2]) > 0;
    },
    { timeout: 10000 },
  );
}

export async function getTotalMatchCount(page: Page): Promise<number> {
  const text = await matchCountSpan(page).textContent();
  const m = text?.match(/of (\d+)/);
  return m ? parseInt(m[1]) : -1;
}

export async function getCurrentMatchIndex(page: Page): Promise<number> {
  const text = await matchCountSpan(page).textContent();
  const m = text?.match(/^(\d+) of/);
  return m ? parseInt(m[1]) : -1;
}

export async function waitForHighlights(page: Page) {
  await page.locator("[data-find-hl]").first().waitFor({ timeout: 5000 });
}

export async function waitForHighlightsCleared(page: Page) {
  await page.waitForFunction(() => document.querySelectorAll("[data-find-hl]").length === 0, { timeout: 5000 });
}

export async function waitForReplaceComplete(page: Page, marker: string) {
  await page.waitForFunction((text: string) => document.body.textContent?.includes(text), marker, { timeout: 10000 });
}
