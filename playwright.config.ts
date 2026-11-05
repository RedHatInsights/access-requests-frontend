import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for internal user testing.
 *
 * Default baseURL targets the Konflux dev-proxy (stage.foo.redhat.com:1337).
 * Override with PLAYWRIGHT_BASE_URL for local runs against real stage.
 *
 * Usage:
 *   npx playwright test                                                   # CI / Konflux
 *   PLAYWRIGHT_BASE_URL=https://console.stage.redhat.com npx playwright test  # local
 */

export default defineConfig({
  testDir: './playwright/e2e',

  // Global setup runs once before all tests
  globalSetup: require.resolve('./playwright/setup/global-setup.ts'),

  // Slow SSO + federated modules in Konflux — 3 min per test
  timeout: 180_000,

  // Expect timeout for assertions
  expect: {
    timeout: 15_000,
  },

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Serial execution — parallel runs flaky in CI
  fullyParallel: false,
  workers: 1,

  // Reporter to use
  reporter: [
    ['html'],
    ['list']
  ],

  use: {
    // PLAYWRIGHT_BASE_URL overrides for local runs; default is the dev proxy (Konflux CI)
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://stage.foo.redhat.com:1337',

    // Storage state file (contains authenticated session)
    storageState: 'playwright/.auth/internal-user.json',

    // Collect trace on failure for debugging
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Maximum time each action can take
    actionTimeout: 15_000,

    // Ignore HTTPS errors (staging certs)
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Uncomment to test on additional browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Folder for test artifacts
  outputDir: 'playwright/test-results',
});
