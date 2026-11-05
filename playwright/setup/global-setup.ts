import { chromium, FullConfig, Page } from '@playwright/test';

/**
 * Global setup for Playwright tests with internal user authentication.
 *
 * Navigates through the dev-proxy (baseURL) which triggers OIDC → SSO login.
 * After authentication, saves browser state for tests to reuse.
 *
 * Based on the notifications-frontend pattern (proven in Konflux CI).
 *
 * Prerequisites:
 * - E2E_USER and E2E_PASSWORD environment variables (ExternalSecret in CI)
 */

/**
 * Timeout constants (in milliseconds)
 */
const TIMEOUTS = {
  PAGE_LOAD: 120_000,
  SSO_REDIRECT: 60_000,
  NETWORK_IDLE: 30_000,
  PASSWORD_FIELD: 15_000,
  MODAL_VISIBILITY: 2_000,
  MODAL_DISMISS: 1_000,
  STATE_STABILIZATION: 3_000,
} as const;

/**
 * SSO Selectors
 */
const SSO_SELECTORS = {
  usernameInput: 'input[name="username"]',
  passwordInput: 'input[name="password"]',
  passwordInputAlt: 'input[type="password"]',
  submitButton: 'input[type="submit"]',
  nextButton: 'button:has-text("Next"), button:has-text("Continue")',
  closeButton: 'button[aria-label="Close"], button:has-text("Close")',
  internalSsoHeading: 'text="Internal single sign-on"',
  kerberosUsernameInput: 'input[name="username"], input[placeholder*="Kerberos"]',
  kerberosPasswordInput: 'input[name="password"][type="password"]',
  kerberosSubmitButton: 'button:has-text("Log in to SSO"), input[value="Log in to SSO"], input[type="submit"]',
  greeting: 'text=Hi,',
} as const;

/**
 * Screenshot paths
 */
const SCREENSHOT_PATHS = {
  passwordNotFound: 'playwright/test-results/setup-error-password-not-found.png',
  errorFinal: 'playwright/test-results/setup-error-final.png',
} as const;

/**
 * Disable TrustArc cookie consent popups that block UI interactions
 */
async function disableCookiePrompt(page: Page) {
  await page.route('**/*', async (route, request) => {
    const url = request.url();
    if (
      (url.includes('consent.trustarc.com') || url.includes('trustarc.com')) &&
      request.resourceType() !== 'document'
    ) {
      await route.abort();
    } else {
      await route.continue();
    }
  });
}

/**
 * Perform SSO login — handles username, password, modals, and internal SSO page
 */
async function performSSOLogin(page: Page, username: string, password: string) {
  // Fill username
  await page.waitForSelector(SSO_SELECTORS.usernameInput, { state: 'visible', timeout: TIMEOUTS.SSO_REDIRECT });
  await page.fill(SSO_SELECTORS.usernameInput, username);
  console.log('✓ Filled username');

  // Click next/submit
  const submitBtn = page.locator(SSO_SELECTORS.submitButton).first();
  if (await submitBtn.isVisible()) {
    await submitBtn.click();
    console.log('✓ Clicked next');
  }

  // Handle "Link your email" or similar modal
  await page.waitForTimeout(TIMEOUTS.MODAL_DISMISS);
  const modalNextButton = page.locator(SSO_SELECTORS.nextButton);
  if (await modalNextButton.isVisible({ timeout: TIMEOUTS.MODAL_VISIBILITY }).catch(() => false)) {
    console.log('✓ Found modal, dismissing');
    await modalNextButton.click();
    await page.waitForTimeout(TIMEOUTS.MODAL_DISMISS);
  }

  // Fill password
  console.log('Waiting for password field...');
  const passwordField = page.locator(SSO_SELECTORS.passwordInput)
    .or(page.locator(SSO_SELECTORS.passwordInputAlt))
    .first();

  try {
    await passwordField.waitFor({ state: 'visible', timeout: TIMEOUTS.PASSWORD_FIELD });
  } catch (err) {
    await page.screenshot({ path: SCREENSHOT_PATHS.passwordNotFound, fullPage: true });
    throw err;
  }

  await passwordField.fill(password);
  console.log('✓ Filled password');
  await page.click(SSO_SELECTORS.submitButton);
  console.log('✓ Clicked submit');

  // Wait for page transition
  await page.waitForLoadState('domcontentloaded', { timeout: TIMEOUTS.NETWORK_IDLE });

  // Handle internal SSO page (Kerberos) if it appears
  const internalSsoHeading = page.locator(SSO_SELECTORS.internalSsoHeading);
  if (await internalSsoHeading.isVisible({ timeout: 5_000 }).catch(() => false)) {
    console.log('✓ Found internal SSO page');

    // Close any modal
    const closeBtn = page.locator(SSO_SELECTORS.closeButton);
    if (await closeBtn.isVisible({ timeout: TIMEOUTS.MODAL_VISIBILITY }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(TIMEOUTS.MODAL_DISMISS);
    }

    // Fill Kerberos credentials
    const kerbUser = page.locator(SSO_SELECTORS.kerberosUsernameInput).first();
    const kerbPass = page.locator(SSO_SELECTORS.kerberosPasswordInput).first();
    await kerbUser.clear();
    await kerbUser.fill(username);
    await kerbPass.clear();
    await kerbPass.fill(password);
    console.log('✓ Filled Kerberos credentials');

    const loginBtn = page.locator(SSO_SELECTORS.kerberosSubmitButton).first();
    await loginBtn.click();
    console.log('✓ Clicked Kerberos login');
  }
}

async function globalSetup(config: FullConfig) {
  const { storageState, baseURL } = config.projects[0].use;

  if (!storageState) {
    console.log('No storage state configured, skipping global setup');
    return;
  }

  const username = process.env.E2E_USER;
  const password = process.env.E2E_PASSWORD;

  if (!username || !password) {
    console.error('❌ E2E_USER or E2E_PASSWORD environment variables not set');
    throw new Error('Missing E2E credentials');
  }

  console.log('🔐 Setting up internal user authentication...');
  console.log('Using E2E_USER:', username);
  console.log('Base URL:', baseURL);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: baseURL as string,
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  try {
    await disableCookiePrompt(page);

    // Navigate to app via baseURL — OIDC will redirect to SSO
    await page.goto(baseURL as string, {
      waitUntil: 'load',
      timeout: TIMEOUTS.PAGE_LOAD,
    });
    console.log('✓ Navigated to app, current URL:', page.url());

    // Wait for SSO redirect
    await page.waitForLoadState('load');

    // Perform SSO login
    await performSSOLogin(page, username, password);

    // Wait for redirect back to the app itself. Match the baseURL host exactly —
    // a looser check (any *.redhat.com that is not sso.*) also matches the internal
    // SSO host, so it resolves while login is still in flight and masks the real failure.
    const appHost = new URL(baseURL as string).host;
    await page.waitForURL((url) => url.host === appHost, { timeout: TIMEOUTS.SSO_REDIRECT });
    console.log('✓ Redirected to:', page.url());

    // Wait for app to load and settle
    await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.NETWORK_IDLE }).catch(() => {
      console.log('Network idle timeout — continuing');
    });

    // Verify login succeeded by checking for greeting or dashboard
    try {
      await page.locator(SSO_SELECTORS.greeting).waitFor({
        state: 'visible',
        timeout: TIMEOUTS.PAGE_LOAD,
      });
      console.log('✓ Login successful — greeting visible');
    } catch {
      // Some pages might not show greeting — check for other indicators
      console.log('Greeting not found, checking authentication via cookies...');
      const cookies = await context.cookies();
      const csJwt = cookies.find(c => c.name === 'cs_jwt');
      if (!csJwt) {
        throw new Error('Login failed — no cs_jwt cookie found');
      }
      console.log('✓ Login successful — cs_jwt cookie present');
    }

    // Wait for state to stabilize
    await page.waitForTimeout(TIMEOUTS.STATE_STABILIZATION);

    // Save authenticated state (cookies + localStorage, which holds the OIDC user).
    // Tests pick this up via use.storageState in playwright.config.ts.
    await context.storageState({ path: storageState as string });
    console.log('✓ Authentication state saved to:', storageState);
  } catch (error) {
    console.error('❌ Global setup failed:', error);

    try {
      await page.screenshot({ path: SCREENSHOT_PATHS.errorFinal, fullPage: true });
      console.log(`✓ Error screenshot saved to ${SCREENSHOT_PATHS.errorFinal}`);
    } catch (screenshotError) {
      console.error('Failed to capture error screenshot:', screenshotError);
    }

    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;
