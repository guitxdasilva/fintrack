import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests run the production build against a disposable local database.
 * E2E_DATABASE_URL must point to localhost — global-setup wipes it.
 */
const PORT = 3100;
const DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? "postgresql://postgres@localhost:54329/fintrack_e2e";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
    // Locally use the installed Chrome; CI installs Playwright's Chromium.
    channel: process.env.CI ? undefined : "chrome",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.CI ? undefined : "chrome",
        storageState: "e2e/.auth/user.json",
      },
    },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL,
      AUTH_SECRET: "e2e-secret",
      AUTH_TRUST_HOST: "true",
      NEXTAUTH_URL: `http://localhost:${PORT}`,
    },
  },
});
