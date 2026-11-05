import { test as base, BrowserContext, Page } from '@playwright/test';
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
 * 1. Creates a browser context with the chrome.auth.getUser() override installed
 * 2. Reuses the authenticated session produced by global-setup (see below)
 * 3. Swaps the OIDC token and sets profile.is_internal: true
 * 4. Returns a page with internal user access enabled
 *
 * WHERE THE SESSION COMES FROM:
 * =============================
 * SSO login happens exactly once, in playwright/setup/global-setup.ts, which saves
 * the result to the path in `use.storageState` (playwright.config.ts).
 *
 * Playwright merges `use` options into browser.newContext() calls made inside a test,
 * so the context below inherits that storageState (and baseURL) automatically — it does
 * NOT need to, and must not, log in again. An earlier version of this fixture performed
 * its own SSO login on the assumption that the context started empty; once global-setup
 * began succeeding, that login hung for 60s waiting for a login form that never rendered,
 * because the page was already authenticated.
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

/**
 * Fallback when no baseURL is configured (matches playwright.config.ts)
 */
const DEFAULT_APP_URL = 'https://stage.foo.redhat.com:1337';

/**
 * Timeouts (in milliseconds)
 */
const TIMEOUTS = {
  pageLoad: 120_000,
  chromeReinit: 10_000,
} as const;

type InternalUserFixtures = {
  internalUserContext: BrowserContext;
  internalUserPage: Page;
};

/**
 * True if the URL belongs to a Red Hat SSO host, i.e. we were bounced back to login.
 */
function isSSOUrl(url: string): boolean {
  try {
    return new URL(url).hostname.startsWith('sso.');
  } catch {
    return false;
  }
}

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
      if (typeof key === 'string' && key.startsWith('oidc.user:') && value) {
        try {
          const data = JSON.parse(value);
          if (data.profile) {
            data.profile.is_internal = true;
            return JSON.stringify(data);
          }
        } catch (e) {
          // If OIDC data is malformed, return original value unchanged
          console.warn('Failed to parse OIDC user data from localStorage:', e);
          return value;
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
    // storageState and baseURL are inherited from `use` in playwright.config.ts —
    // do not pass them here, and do not opt out of them: the session saved by
    // global-setup is what authenticates this context.
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
    });

    // Install TWO-LAYER chrome.auth.getUser() override BEFORE any page loads
    await context.addInitScript(createChromeAuthOverride());

    await use(context);

    await context.close();
  },

  internalUserPage: async ({ internalUserContext, baseURL }, use) => {
    const page = await internalUserContext.newPage();
    const appURL = baseURL || DEFAULT_APP_URL;

    // TrustArc consent banner overlays the page and swallows clicks in CI
    await disableCookiePrompt(page);

    //=========================================================================
    // Step 1: Load the app using the session saved by global-setup
    //=========================================================================

    await page.goto(appURL, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });

    if (isSSOUrl(page.url())) {
      throw new Error(
        `Expected an authenticated session but was redirected to SSO (${page.url()}).\n` +
        'The storage state saved by global-setup is missing or expired — check that ' +
        'global-setup completed and that use.storageState points at its output.'
      );
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
      throw new Error(
        'OIDC state not found in localStorage. global-setup should have saved it as part ' +
        'of the storage state for this origin.'
      );
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
    await page.evaluate(({ oidcKey, token, claims }) => {
      const newOidcUser = {
        id_token: token,
        access_token: token,
        token_type: 'Bearer',
        refresh_token: '',
        profile: {
          ...claims,
          is_internal: true, // Override: JWT has false, but we need true
          is_org_admin: claims.is_org_admin,
        },
        expires_at: claims.exp,
        expires_in: claims.exp - Math.floor(Date.now() / 1000),
        expired: false,
        scopes: (claims.scope || '').split(' '),
        session_state: claims.session_state || null,
      };

      localStorage.setItem(oidcKey, JSON.stringify(newOidcUser));
      localStorage.setItem('cs_jwt', token);
    }, {
      oidcKey: oidcState.key,
      token,
      claims,
    });

    // Reload to activate overrides (Storage.prototype.getItem will maintain is_internal: true)
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(TIMEOUTS.chromeReinit);

    // Verify session survived the swap
    if (isSSOUrl(page.url())) {
      throw new Error('Session swap failed - redirected to SSO');
    }

    await use(page);
  },
});

export { expect } from '@playwright/test';
