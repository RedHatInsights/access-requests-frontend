import { test as base, BrowserContext, Page } from '@playwright/test';
import { disableCookiePrompt } from '@redhat-cloud-services/playwright-test-auth';
import { FORCE_INTERNAL_USER_KEY } from '../../src/Hooks/internalUserOverride';

/**
 * Configuration for SSO login
 */
const SSO_CONFIG = {
  console: {
    url: process.env.BASE_URL || 'https://console.stage.redhat.com',
    ssoUrl: 'sso.stage.redhat.com',
    cookieDomain: '.stage.redhat.com',
  },
  proxy: process.env.CI ? undefined : { server: 'http://squid.corp.redhat.com:3128' },
  timeouts: {
    pageLoad: 60_000,
    ssoRedirect: 30_000,
    ssoStage: 15_000,
    oidcInit: 2_000,
    modalVisibility: 2_000,
    modalDismiss: 1_000,
  },
} as const;

/**
 * SSO Selectors
 */
const SSO_SELECTORS = {
  usernameInput: 'input[name="username"]',
  passwordInput: 'input[name="password"]',
  nextButton: 'button:has-text("Next"), input[type="submit"]',
  submitButton: 'input[type="submit"], button[type="submit"]',
  greeting: 'text=Hi,',
} as const;

/**
 * Internal User Fixture
 *
 * Logs in with real SSO credentials, then sets the app's UI-only localStorage
 * override before loading the access requests page. It does not change the
 * authenticated identity or grant permissions on the server.
 *
 * USAGE:
 * ======
 * import { test, expect } from '../fixtures/internal-user-fixture';
 *
 * test('my internal user test', async ({ internalUserPage }) => {
 *   await internalUserPage.goto('/iam/my-user-access');
 *   // TAM invite button is now visible!
 * });
 */

type InternalUserFixtures = {
  internalUserContext: BrowserContext;
  internalUserPage: Page;
};

export const test = base.extend<InternalUserFixtures>({
  internalUserContext: async ({ browser }, use) => {
    // Create a fresh browser context for SSO login.
    // Do NOT load storageState - we'll perform SSO login directly
    const context = await browser.newContext({
      baseURL: SSO_CONFIG.console.url,
      ignoreHTTPSErrors: true,
      ...(SSO_CONFIG.proxy && { proxy: SSO_CONFIG.proxy }),
    });

    await use(context);

    await context.close();
  },

  internalUserPage: async ({ internalUserContext }, use) => {
    const page = await internalUserContext.newPage();

    // Get credentials from environment
    const ssoUser = process.env.E2E_USER;
    const ssoPassword = process.env.E2E_PASSWORD;

    if (!ssoUser || !ssoPassword) {
      throw new Error(
        'E2E_USER and E2E_PASSWORD environment variables must be set.\n\n' +
        'These are required for SSO authentication in the internal user fixture.'
      );
    }

    //=========================================================================
    // Step 1: Perform SSO Login (two-stage: SSO + Kerberos)
    //=========================================================================

    await disableCookiePrompt(page);
    await page.goto(SSO_CONFIG.console.url, {
      waitUntil: 'domcontentloaded',
      timeout: SSO_CONFIG.timeouts.pageLoad
    });
    await page.waitForURL(`**/${SSO_CONFIG.console.ssoUrl}/**`, {
      timeout: SSO_CONFIG.timeouts.ssoRedirect
    });

    // SSO Stage 1: Username and password
    await page.waitForSelector(SSO_SELECTORS.usernameInput, { state: 'visible' });
    await page.fill(SSO_SELECTORS.usernameInput, ssoUser);
    await page.click(SSO_SELECTORS.nextButton);

    // Handle email linking modal if it appears
    const modalNextButton = page.locator('button:has-text("Next")').first();
    if (await modalNextButton.isVisible({ timeout: SSO_CONFIG.timeouts.modalVisibility }).catch(() => false)) {
      await modalNextButton.click();
      await page.waitForTimeout(SSO_CONFIG.timeouts.modalDismiss);
    }

    await page.waitForSelector(SSO_SELECTORS.passwordInput, { state: 'visible' });
    await page.fill(SSO_SELECTORS.passwordInput, ssoPassword);
    await page.click(SSO_SELECTORS.submitButton);

    // SSO Stage 2: Kerberos prompt (if appears)
    await Promise.race([
      page.waitForSelector(SSO_SELECTORS.usernameInput, {
        state: 'visible',
        timeout: SSO_CONFIG.timeouts.ssoStage
      }),
      page.waitForURL(`**/${SSO_CONFIG.console.url.replace('https://', '')}/**`, {
        timeout: SSO_CONFIG.timeouts.ssoStage
      }),
      page.waitForSelector(SSO_SELECTORS.greeting, {
        state: 'visible',
        timeout: SSO_CONFIG.timeouts.ssoStage
      })
    ]).catch(() => {});

    if (await page.locator(SSO_SELECTORS.usernameInput).isVisible().catch(() => false)) {
      await page.fill(SSO_SELECTORS.usernameInput, ssoUser);
      await page.fill(SSO_SELECTORS.passwordInput, ssoPassword);
      await page.click(SSO_SELECTORS.submitButton);
      await Promise.race([
        page.waitForURL(`**/${SSO_CONFIG.console.url.replace('https://', '')}/**`, {
          timeout: SSO_CONFIG.timeouts.ssoStage
        }),
        page.waitForSelector(SSO_SELECTORS.greeting, {
          state: 'visible',
          timeout: SSO_CONFIG.timeouts.ssoStage
        })
      ]).catch(() => {});
    }

    // Wait for OIDC initialization
    await page.waitForTimeout(SSO_CONFIG.timeouts.oidcInit);
    if (page.url().includes('#')) {
      await page.goto(SSO_CONFIG.console.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(SSO_CONFIG.timeouts.oidcInit);
    }

    // Set the app's override on the console origin; it takes effect on the next
    // navigation when useUserData reads chrome.auth.getUser().
    if (new URL(page.url()).origin !== new URL(SSO_CONFIG.console.url).origin) {
      throw new Error(`SSO did not return to the test app origin: ${page.url()}`);
    }
    await page.evaluate((key) => localStorage.setItem(key, 'true'), FORCE_INTERNAL_USER_KEY);

    await use(page);
  },
});

export { expect } from '@playwright/test';
