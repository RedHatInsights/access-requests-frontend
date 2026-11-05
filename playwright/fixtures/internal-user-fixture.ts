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
    // Step 2: Force is_internal: true on the stored OIDC profile
    //=========================================================================

    // Mutate ONLY profile.is_internal, leaving the rest of the stored OIDC user
    // untouched. Rebuilding the object loses access_token and refresh_token; a
    // previous version assigned id_token to access_token, so the app sent the ID
    // token as its bearer and the gateway answered 401 to every API call.
    const swap = await page.evaluate(() => {
      const key = Object.keys(localStorage).find(k => k.startsWith('oidc.user:'));
      if (!key) return { ok: false as const, reason: 'no oidc.user:* key in localStorage' };

      const raw = localStorage.getItem(key);
      if (!raw) return { ok: false as const, reason: `empty value at ${key}` };

      const user = JSON.parse(raw);
      if (!user.access_token) return { ok: false as const, reason: `no access_token at ${key}` };

      user.profile = { ...user.profile, is_internal: true };
      localStorage.setItem(key, JSON.stringify(user));
      return { ok: true as const, reason: '' };
    });

    if (!swap.ok) {
      throw new Error(
        `Could not apply the is_internal override: ${swap.reason}. global-setup should have ` +
        'saved the OIDC user as part of the storage state for this origin.'
      );
    }

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
