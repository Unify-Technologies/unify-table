import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  timeout: 120000,
  use: {
    baseURL: "http://localhost:5173/unify-table/",
    trace: "on-first-retry",
    viewport: { width: 1440, height: 900 },
    launchOptions: {
      args: ["--enable-features=SharedArrayBuffer"],
    },
  },
  webServer: {
    command: "pnpm exec vite --port 5173",
    port: 5173,
    reuseExistingServer: true,
    timeout: 30000,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
