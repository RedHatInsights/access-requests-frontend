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
  const context = await browser.newContext({
    baseURL: baseURL,
    ignoreHTTPSErrors: true,
  });

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

    // Fill in login form
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('input[type="submit"]');

    // Wait for redirect
    await page.waitForURL((url) => url.hostname.includes('redhat.com'), { timeout: 30000 });

    // Extract the cs_jwt token from cookies
    const cookies = await context.cookies();
    const csJwtCookie = cookies.find(c => c.name === 'cs_jwt');

    if (!csJwtCookie) {
      throw new Error('cs_jwt cookie not found after login');
    }

    const token = csJwtCookie.value;

    console.log('✓ Token extracted from cookies');

    // Decode token to get claims
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const claims = JSON.parse(Buffer.from(padded, 'base64').toString());

    // Inject internal user token and OIDC state
    await page.evaluate(({ token, claims }) => {
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
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Verify authentication by checking identity endpoint
    const response = await page.request.get(
      'https://console.stage.redhat.com/api/apicast-tests/identity'
    );

    if (response.status() !== 200) {
      throw new Error(`Identity check failed with status ${response.status()}`);
    }

    const identity = await response.json();

    if (!identity.identity.user.is_internal) {
      throw new Error('Token does not have is_internal: true. Check Vault token configuration.');
    }

    console.log('✓ Internal user authenticated:', identity.identity.user.username);
    console.log('✓ is_internal:', identity.identity.user.is_internal);
    console.log('✓ Org ID:', identity.identity.org_id);

    // Save authenticated state (includes localStorage and cookies)
    await context.storageState({ path: storageState as string });

    console.log('✓ Authentication state saved to:', storageState);
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;
