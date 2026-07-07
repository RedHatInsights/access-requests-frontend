import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for internal user testing.
 *
 * This config uses global setup to authenticate with the internal user token
 * from Vault, enabling tests to verify is_internal: true functionality.
 *
 * Prerequisites:
 * - Vault CLI installed
 * - VPN connection
 * - Access to Vault path: insights/secrets/qe/stage/users/idp_internal_user
 *
 * Usage:
 *   npx playwright test                    # Run all tests
 *   npx playwright test --debug            # Debug mode
 *   npx playwright test --ui               # UI mode
 *   npx playwright show-report             # View report
 */

export default defineConfig({
  testDir: './playwright/e2e',

  // Global setup runs once before all tests
  globalSetup: require.resolve('./playwright/setup/global-setup.ts'),

  // Timeout for each test
  timeout: 60000,

  // Expect timeout for assertions
  expect: {
    timeout: 10000
  },

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html'],
    ['list']
  ],

  use: {
    // Base URL for the application
    // In CI (Konflux): Uses https://stage.foo.redhat.com:1337 (proxied environment)
    // Locally: Can override with BASE_URL env var
    baseURL: process.env.BASE_URL || 'https://console.stage.redhat.com',

    // Storage state file (contains authenticated session)
    storageState: 'playwright/.auth/internal-user.json',

    // Collect trace on failure for debugging
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Maximum time each action can take
    actionTimeout: 15000,

    // Ignore HTTPS errors (staging certs)
    ignoreHTTPSErrors: true
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
