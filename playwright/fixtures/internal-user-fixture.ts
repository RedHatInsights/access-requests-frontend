import { test as base, Browser, BrowserContext, Page } from '@playwright/test';
import { disableCookiePrompt } from '@redhat-cloud-services/playwright-test-auth';

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
 * Creates the chrome.auth.getUser() override script.
 * This forces is_internal: true in the user profile.
 */
function createChromeAuthOverride() {
  return `
    // Override chrome.auth.getUser() to return is_internal: true
    window.insights = window.insights || {};
    window.insights.chrome = window.insights.chrome || {};
    window.insights.chrome.auth = window.insights.chrome.auth || {};

    const originalGetUser = window.insights.chrome.auth.getUser;

    window.insights.chrome.auth.getUser = async function() {
      const user = originalGetUser ? await originalGetUser.call(this) : null;
      if (user && user.identity && user.identity.user) {
        // Force is_internal to true
        user.identity.user.is_internal = true;
      }
      return user;
    };
  `;
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
    // Create a new browser context with chrome.auth override
    const context = await browser.newContext({
      baseURL: process.env.BASE_URL || 'https://console.stage.redhat.com',
      ignoreHTTPSErrors: true,
    });

    // Install chrome.auth.getUser() override BEFORE any page loads
    await context.addInitScript(createChromeAuthOverride());

    await use(context);

    await context.close();
  },

  internalUserPage: async ({ internalUserContext }, use) => {
    const page = await internalUserContext.newPage();

    // Disable cookie consent popup
    await disableCookiePrompt(page);

    // Navigate to console to trigger OIDC initialization
    const baseURL = process.env.BASE_URL || 'https://console.stage.redhat.com';
    await page.goto(baseURL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for OIDC initialization
    await page.waitForTimeout(2000);

    // Get the authenticated token from global-setup
    const token = await page.evaluate(() => localStorage.getItem('cs_jwt'));

    if (!token) {
      throw new Error('cs_jwt token not found - global-setup may have failed');
    }

    const claims = decodeJWT(token);

    // Find OIDC state in localStorage
    const oidcState = await page.evaluate(() => {
      const key = Object.keys(localStorage).find(k => k.startsWith('oidc.user:'));
      return key ? { key, storage: 'localStorage' } : null;
    });

    if (!oidcState) {
      throw new Error('OIDC state not found in localStorage');
    }

    // Swap OIDC token with is_internal override
    await page.evaluate(({ oidcKey, token, claims }) => {
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

      // Also set cookie
      const expires = new Date(claims.exp * 1000).toUTCString();
      document.cookie = `cs_jwt=${token}; path=/; domain=.stage.redhat.com; secure; expires=${expires}`;
    }, {
      oidcKey: oidcState.key,
      token,
      claims
    });

    // Reload to activate the override
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Verify we didn't get redirected to SSO
    if (page.url().includes('sso.stage.redhat.com')) {
      throw new Error('Token swap failed - redirected to SSO');
    }

    console.log('✓ Internal user context ready (is_internal: true)');

    await use(page);
  },
});

export { expect } from '@playwright/test';
