import { test as base, Browser, BrowserContext, Page } from '@playwright/test';
import { disableCookiePrompt } from '@redhat-cloud-services/playwright-test-auth';
import * as fs from 'fs';
import * as path from 'path';

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
    chromeReinit: 5_000,
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
 * Provides a browser context and page with is_internal: true properly set.
 *
 * CRITICAL: This fixture is REQUIRED for testing internal-only features like TAM invites.
 *
 * WHY THIS EXISTS:
 * ================
 * - JWT tokens from SSO have is_internal: FALSE even for internal users
 * - The 3scale API gateway injects is_internal: TRUE in API responses
 * - BUT the frontend reads chrome.auth.getUser() which reads JWT directly
 * - React components cache this user object before API calls complete
 *
 * WHAT THIS DOES:
 * ===============
 * 1. Creates a fresh browser context with chrome.auth.getUser() override
 * 2. Gets the authenticated token from global-setup
 * 3. Swaps the OIDC token and sets profile.is_internal: true
 * 4. Returns a page with internal user access enabled
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

/**
 * Chrome auth override script that forces is_internal: true.
 *
 * TWO-LAYER APPROACH (from 3scale-interaction PoC):
 * - Layer 1: Intercept localStorage.getItem() to inject is_internal: true on every read
 * - Layer 2: Override chrome.auth.getUser() to inject is_internal: true
 *
 * Layer 1 is critical - it ensures the override persists across page navigations
 * and component re-renders, since every localStorage read gets the override.
 *
 * Note: This must be a function (not a string) so Playwright can serialize it properly.
 * The function will be evaluated in the browser context where Storage, window, etc. exist.
 */
function createChromeAuthOverride() {
  return () => {
    // Layer 1: Override localStorage reads to inject is_internal: true
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key: string) {
      const value = originalGetItem.call(this, key);
      if (key.startsWith('oidc.user:') && value) {
        try {
          const data = JSON.parse(value);
          if (data.profile) {
            data.profile.is_internal = true;
            return JSON.stringify(data);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      return value;
    };

    // Layer 2: Override chrome.auth.getUser() before React mounts
    const POLL_INTERVAL = 50;
    const POLL_TIMEOUT = 30_000;

    const checkInterval = setInterval(() => {
      if ((window as any).insights?.chrome?.auth?.getUser) {
        clearInterval(checkInterval);

        const originalGetUser = (window as any).insights.chrome.auth.getUser;
        (window as any).insights.chrome.auth.getUser = async function() {
          const user = await originalGetUser.call(this);
          if (user?.identity?.user) {
            user.identity.user.is_internal = true;
          }
          return user;
        };
      }
    }, POLL_INTERVAL);

    setTimeout(() => clearInterval(checkInterval), POLL_TIMEOUT);
  };
}

/**
 * Decodes a JWT token to get claims
 */
function decodeJWT(token: string): any {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  const payload = parts[1];
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  return JSON.parse(Buffer.from(padded, 'base64').toString());
}

export const test = base.extend<InternalUserFixtures>({
  internalUserContext: async ({ browser }, use) => {
    // Create a fresh browser context with chrome.auth override
    // Do NOT load storageState - we'll perform SSO login directly
    const context = await browser.newContext({
      baseURL: SSO_CONFIG.console.url,
      ignoreHTTPSErrors: true,
      ...(SSO_CONFIG.proxy && { proxy: SSO_CONFIG.proxy }),
    });

    // Install TWO-LAYER chrome.auth.getUser() override BEFORE any page loads
    await context.addInitScript(createChromeAuthOverride());

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

    //=========================================================================
    // Step 2: Swap OIDC Token with is_internal: true
    //=========================================================================

    // Find OIDC state in storage
    const oidcState = await page.evaluate(() => {
      const key = Object.keys(localStorage).find(k => k.startsWith('oidc.user:'));
      return key ? { key, storage: 'localStorage' } : null;
    });

    if (!oidcState) {
      throw new Error('OIDC state not found in localStorage after SSO login');
    }

    // Get the current OIDC user data
    const oidcUserData = await page.evaluate((key) => {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }, oidcState.key);

    if (!oidcUserData || !oidcUserData.id_token) {
      throw new Error('No token found in OIDC state');
    }

    const token = oidcUserData.id_token;
    const claims = decodeJWT(token);

    // Swap to our version with is_internal: true override
    await page.evaluate(({ oidcKey, token, claims, cookieDomain }) => {
      const newOidcUser = {
        id_token: token,
        access_token: token,
        token_type: 'Bearer',
        refresh_token: '',
        profile: {
          ...claims,
          is_internal: true, // Override: JWT has false, but we need true
          is_org_admin: claims.is_org_admin
        },
        expires_at: claims.exp,
        expires_in: claims.exp - Math.floor(Date.now() / 1000),
        expired: false,
        scopes: (claims.scope || '').split(' '),
        session_state: claims.session_state || null
      };

      localStorage.setItem(oidcKey, JSON.stringify(newOidcUser));
      localStorage.setItem('cs_jwt', token);
      const expires = new Date(claims.exp * 1000).toUTCString();
      document.cookie = `cs_jwt=${token}; path=/; domain=${cookieDomain}; secure; expires=${expires}`;
    }, {
      oidcKey: oidcState.key,
      token,
      claims,
      cookieDomain: SSO_CONFIG.console.cookieDomain
    });

    // Reload to activate overrides (Storage.prototype.getItem will maintain is_internal: true)
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(SSO_CONFIG.timeouts.chromeReinit);

    // Verify session is valid
    if (page.url().includes(SSO_CONFIG.console.ssoUrl)) {
      throw new Error('Session swap failed - redirected to SSO');
    }

    await use(page);
  },
});

export { expect } from '@playwright/test';
