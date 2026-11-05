import { defineConfig, devices } from '@playwright/test';

/** Playwright configuration for the authenticated staging E2E tests. */

export default defineConfig({
  testDir: './playwright/e2e',

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

    // Collect trace on failure for debugging
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Maximum time each action can take
    actionTimeout: 15000,

    // Ignore HTTPS errors (staging certs)
    ignoreHTTPSErrors: true,

    // Use proxy for local development against stage (not needed in CI)
    ...(!process.env.CI && {
      proxy: {
        server: 'http://squid.corp.redhat.com:3128'
      }
    })
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
