import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests with internal user authentication.
 *
 * This setup:
 * 1. Authenticates using E2E_USER and E2E_PASSWORD environment variables
 * 2. Extracts the JWT token from the authenticated session
 * 3. Injects token and OIDC state into browser storage
 * 4. Saves authenticated state for all tests to use
 *
 * Prerequisites:
 * - E2E_USER and E2E_PASSWORD environment variables (provided by ExternalSecret in CI)
 */

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
    console.error('Set these before running tests:');
    console.error('  export E2E_USER=your-username');
    console.error('  export E2E_PASSWORD=your-password');
    throw new Error('Missing E2E credentials');
  }

  console.log('🔐 Setting up internal user authentication...');
  console.log('Using E2E_USER:', username);

  // Create browser context and perform login
  const browser = await chromium.launch();

  // Use proxy for local development against stage (not needed in CI)
  const contextOptions: any = {
    baseURL: baseURL,
    ignoreHTTPSErrors: true,
  };

  if (!process.env.CI) {
    contextOptions.proxy = {
      server: 'http://squid.corp.redhat.com:3128'
    };
    console.log('Using proxy for local development');
  }

  const context = await browser.newContext(contextOptions);

  const page = await context.newPage();

  // Perform login to get authenticated token
  try {
    // Navigate to login
    const loginUrl = 'https://sso.stage.redhat.com/auth/realms/redhat-external/protocol/openid-connect/auth';
    const params = new URLSearchParams({
      client_id: 'cloud-services',
      redirect_uri: baseURL || 'https://console.stage.redhat.com',
      response_type: 'code',
      scope: 'openid',
    });

    await page.goto(`${loginUrl}?${params.toString()}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('✓ Navigated to login page');

    // Take screenshot after initial page load
    await page.screenshot({ path: 'playwright/test-results/setup-01-login-page.png', fullPage: true });

    // Fill in login form
    await page.fill('input[name="username"]', username);
    console.log('✓ Filled username');

    // Click next/continue after username (if there's a separate step)
    const nextButton = page.locator('input[type="submit"]').first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      console.log('✓ Clicked next button');
      await page.screenshot({ path: 'playwright/test-results/setup-02-after-username.png', fullPage: true });
    }

    // Handle any modal/popup that might appear (e.g., "Link your email address")
    // Wait a moment for any modal to appear
    await page.waitForTimeout(1000);

    // Look for modal close button or "Next" button in modal
    const modalNextButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
    if (await modalNextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✓ Found modal, clicking to dismiss');
      await modalNextButton.click();
      await page.screenshot({ path: 'playwright/test-results/setup-02b-after-modal.png', fullPage: true });
      await page.waitForTimeout(500);
    }

    // Wait for password field to be visible and fill it
    console.log('Waiting for password field...');

    // Try multiple strategies to find the password field
    const passwordField = page.locator('input[name="password"]').or(page.locator('input[type="password"]')).first();

    try {
      await passwordField.waitFor({ state: 'visible', timeout: 10000 });
      console.log('✓ Password field visible');
    } catch (err) {
      // Take screenshot to debug what's on the page
      await page.screenshot({ path: 'playwright/test-results/setup-error-password-not-found.png', fullPage: true });

      // Log page content for debugging
      const pageContent = await page.content();
      console.error('Page HTML (first 2000 chars):', pageContent.substring(0, 2000));

      // Log all input fields
      const inputs = await page.locator('input').all();
      console.error('Found input fields:', inputs.length);
      for (const input of inputs) {
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const id = await input.getAttribute('id');
        console.error(`  - input[type="${type}"][name="${name}"][id="${id}"]`);
      }

      throw err;
    }

    await passwordField.fill(password);
    console.log('✓ Filled password');

    await page.screenshot({ path: 'playwright/test-results/setup-03-before-submit.png', fullPage: true });

    await page.click('input[type="submit"]');
    console.log('✓ Clicked submit');

    // Wait for any page transition
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.screenshot({ path: 'playwright/test-results/setup-04-after-submit.png', fullPage: true });

    // Check if we landed on an internal SSO page
    const internalSsoHeading = page.locator('text="Internal single sign-on"');
    if (await internalSsoHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✓ Found internal SSO page');

      // Dismiss any modals that might be blocking
      const closeModalButton = page.locator('button[aria-label="Close"], button:has-text("Close")');
      if (await closeModalButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeModalButton.click();
        console.log('✓ Closed modal');
        await page.waitForTimeout(500);
      }

      // Fill in Kerberos credentials (same as E2E_USER and E2E_PASSWORD)
      const kerberosUsernameField = page.locator('input[name="username"], input[placeholder*="Kerberos"]').first();
      const kerberosPasswordField = page.locator('input[name="password"][type="password"]').first();

      await kerberosUsernameField.clear();
      await kerberosUsernameField.fill(username);
      console.log('✓ Filled Kerberos username');

      await kerberosPasswordField.clear();
      await kerberosPasswordField.fill(password);
      console.log('✓ Filled Kerberos password');

      await page.screenshot({ path: 'playwright/test-results/setup-05-kerberos-filled.png', fullPage: true });

      // Click the "Log in to SSO" button (could be button or input)
      const loginButton = page.locator('button:has-text("Log in to SSO"), input[value="Log in to SSO"], input[type="submit"]').first();
      await loginButton.click();
      console.log('✓ Clicked Kerberos login button');

      await page.screenshot({ path: 'playwright/test-results/setup-06-after-kerberos-submit.png', fullPage: true });
    }

    // Wait for redirect to redhat.com domain
    await page.waitForURL((url) => url.hostname.includes('redhat.com'), { timeout: 30000 });
    console.log('✓ Redirected to:', page.url());

    // Wait for the page to process the OAuth callback and set cookies
    // The OAuth code needs to be exchanged for tokens, which may take a moment
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    console.log('✓ Network idle, checking for cookies');

    await page.screenshot({ path: 'playwright/test-results/setup-07-after-oauth-callback.png', fullPage: true });

    // Extract the cs_jwt token from cookies
    const cookies = await context.cookies();
    console.log('Available cookies:', cookies.map(c => c.name).join(', '));

    const csJwtCookie = cookies.find(c => c.name === 'cs_jwt');

    if (!csJwtCookie) {
      console.error('cs_jwt cookie not found. Available cookies:', cookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`));
      throw new Error('cs_jwt cookie not found after login');
    }

    const token = csJwtCookie.value;

    console.log('✓ Token extracted from cookies');

    // Close the login context - we'll create a new one with the token properly set
    await page.close();
    await context.close();

    // Create a new context with the cookie preset (like the POC does)
    // This ensures the cookie is available from the start
    const authContextOptions: any = {
      baseURL: baseURL,
      ignoreHTTPSErrors: true,
    };

    if (!process.env.CI) {
      authContextOptions.proxy = {
        server: 'http://squid.corp.redhat.com:3128'
      };
    }

    const authContext = await browser.newContext(authContextOptions);

    // Set cookie BEFORE navigating (this is the key!)
    await authContext.addCookies([{
      name: 'cs_jwt',
      value: token,
      domain: '.stage.redhat.com',
      path: '/',
      expires: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour from now
      httpOnly: false,
      secure: true,
      sameSite: 'None'
    }]);

    console.log('✓ Cookie set with domain .stage.redhat.com and path /');

    const authPage = await authContext.newPage();

    // Now navigate to the app with the cookie already set
    await authPage.goto(baseURL || 'https://console.stage.redhat.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('✓ Navigated to console with auth cookie');

    // Decode token to get claims
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const claims = JSON.parse(Buffer.from(padded, 'base64').toString());

    // Inject internal user token and OIDC state
    await authPage.evaluate(({ token, claims }) => {
      // Set token in localStorage
      localStorage.setItem('cs_jwt', token);

      // Disable analytics for testing
      localStorage.setItem('chrome:analytics:disable', 'true');
      localStorage.setItem('chrome:segment:disable', 'true');

      // Create OIDC user state for react-oidc-context
      // The library stores user in sessionStorage with key: oidc.user:<authority>:<client_id>
      const authority = 'https://sso.stage.redhat.com/auth/realms/redhat-external';
      const clientId = 'cloud-services';
      const oidcKey = `oidc.user:${authority}:${clientId}`;

      const oidcUser = {
        id_token: token, // OIDC library expects id_token
        access_token: token,
        token_type: 'Bearer',
        refresh_token: '', // We don't have a refresh token, but the library might check for it
        profile: {
          ...claims,
          sub: claims.sub,
          aud: claims.aud,
          exp: claims.exp,
          iat: claims.iat,
          iss: claims.iss,
        },
        expires_at: claims.exp,
        expires_in: claims.exp - Math.floor(Date.now() / 1000),
        expired: false,
        scopes: (claims.scope || '').split(' '),
        session_state: claims.session_state || null
      };

      // Store in sessionStorage (OIDC library uses sessionStorage by default)
      sessionStorage.setItem(oidcKey, JSON.stringify(oidcUser));
    }, { token, claims });

    console.log('✓ OIDC state injected');

    // Reload page to pick up OIDC state
    await authPage.reload({ waitUntil: 'domcontentloaded' });
    console.log('✓ Page reloaded with OIDC state');

    // Verify authentication by checking identity endpoint (like the POC does)
    const response = await authPage.request.get(
      'https://console.stage.redhat.com/api/apicast-tests/identity'
    );

    if (response.status() !== 200) {
      throw new Error(`Identity check failed with status ${response.status()}`);
    }

    const identity = await response.json();

    if (!identity.identity.user.is_internal) {
      throw new Error('Token does not have is_internal: true. Check token configuration.');
    }

    console.log('✓ Internal user authenticated:', identity.identity.user.username);
    console.log('✓ is_internal:', identity.identity.user.is_internal);
    console.log('✓ Org ID:', identity.identity.org_id);

    // Get sessionStorage data (needed for OIDC library)
    const sessionStorageData = await authPage.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          data[key] = sessionStorage.getItem(key) || '';
        }
      }
      return data;
    });

    console.log('✓ Captured sessionStorage data');

    // Save authenticated state (includes localStorage and cookies)
    await authContext.storageState({ path: storageState as string });

    // Also save sessionStorage separately (Playwright doesn't save this automatically)
    const fs = require('fs');
    const sessionStoragePath = (storageState as string).replace('.json', '-session.json');
    fs.writeFileSync(sessionStoragePath, JSON.stringify(sessionStorageData, null, 2));

    console.log('✓ Authentication state saved to:', storageState);
    console.log('✓ Session storage saved to:', sessionStoragePath);
  } catch (error) {
    console.error('❌ Global setup failed:', error);

    // Take a final screenshot on any error (try both page variables in case one doesn't exist)
    try {
      if (typeof authPage !== 'undefined') {
        await authPage.screenshot({
          path: 'playwright/test-results/setup-error-final.png',
          fullPage: true
        });
      } else if (typeof page !== 'undefined') {
        await page.screenshot({
          path: 'playwright/test-results/setup-error-final.png',
          fullPage: true
        });
      }
      console.log('✓ Error screenshot saved to playwright/test-results/setup-error-final.png');
    } catch (screenshotError) {
      console.error('Failed to capture error screenshot:', screenshotError);
    }

    throw error;
  } finally {
    // Clean up both contexts if they exist
    try { if (typeof authContext !== 'undefined') await authContext.close(); } catch (e) { /* ignore */ }
    try { if (typeof context !== 'undefined') await context.close(); } catch (e) { /* ignore */ }
    await browser.close();
  }
}

export default globalSetup;
