import { test as base, type Page } from "@playwright/test";

/**
 * Shared-session fixtures: DuckDB-WASM loads once, all tests reuse the same page.
 * Tests use SPA navigation (pushState) instead of full page.goto() reloads.
 */
export const test = base.extend<{}, { sharedPage: Page }>({
  sharedPage: [
    async ({ browser }, use) => {
      const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const page = await ctx.newPage();
      await page.goto("http://localhost:5173/unify-table/");
      // One-time DuckDB-WASM initialization
      await page.waitForFunction(
        () => {
          const root = document.getElementById("root");
          return root && !root.innerHTML.includes("INITIALIZING") && root.querySelector("[data-index], .utbl-scroll, h1");
        },
        null,
        { timeout: 60000 },
      );
      await use(page);
      await ctx.close();
    },
    { scope: "worker" },
  ],

  // Override built-in page fixture to reuse the shared page
  page: async ({ sharedPage }, use) => {
    await use(sharedPage);
  },
});

export { expect } from "@playwright/test";
