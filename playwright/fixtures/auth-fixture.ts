import { test as base, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Fixture that restores sessionStorage from global setup
 *
 * The global setup saves OIDC state to sessionStorage, but Playwright's
 * storageState only saves localStorage and cookies. This fixture restores
 * sessionStorage before each test.
 */

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page, context }, use) => {
    // Load sessionStorage from global setup
    const sessionStoragePath = path.join(__dirname, '../.auth/internal-user-session.json');

    if (fs.existsSync(sessionStoragePath)) {
      const sessionData = JSON.parse(fs.readFileSync(sessionStoragePath, 'utf-8'));

      // Navigate to a page on the domain first so we can set sessionStorage
      await page.goto('https://console.stage.redhat.com/', { waitUntil: 'domcontentloaded' });

      // Restore sessionStorage
      await page.evaluate((data) => {
        for (const [key, value] of Object.entries(data)) {
          sessionStorage.setItem(key, value as string);
        }
      }, sessionData);

      console.log('✓ Session storage restored from global setup');

      // Don't navigate away - the test will navigate where it needs to go
      // The session data is now available for the OIDC library to use
    }

    await use(page);
  },
});

export { expect } from '@playwright/test';
