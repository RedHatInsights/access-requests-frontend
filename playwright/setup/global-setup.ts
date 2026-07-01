import { chromium, FullConfig } from '@playwright/test';
import { getInternalUserToken } from '../vault-client';

/**
 * Global setup for Playwright tests with internal user authentication.
 *
 * This setup:
 * 1. Fetches internal user token from Vault using node-vault
 * 2. Injects token into browser storage
 * 3. Saves authenticated state for all tests to use
 *
 * Prerequisites:
 * - Red Hat VPN connection
 * - Vault token authentication (VAULT_TOKEN env var or ~/.vault-token)
 * - Access to insights/secrets/qe/stage/users/idp_internal_user in Vault
 */

async function globalSetup(config: FullConfig) {
  const { storageState, baseURL } = config.projects[0].use;

  if (!storageState) {
    console.log('No storage state configured, skipping global setup');
    return;
  }

  console.log('🔐 Setting up internal user authentication...');

  // Get internal user token from Vault
  const token = await getInternalUserToken();

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: baseURL,
    ignoreHTTPSErrors: true,
    // Use proxy for stage environment
    proxy: {
      server: 'http://squid.corp.redhat.com:3128'
    }
  });

  const page = await context.newPage();

  try {
    // Set cookie before navigation
    await context.addCookies([{
      name: 'cs_jwt',
      value: token,
      domain: '.stage.redhat.com',
      path: '/',
      expires: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour from now
      httpOnly: false,
      secure: true,
      sameSite: 'None'
    }]);

    // Navigate to the application
    await page.goto(baseURL || '/', { waitUntil: 'domcontentloaded', timeout: 60000 });

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

    // Get sessionStorage data
    const sessionStorageData = await page.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          data[key] = sessionStorage.getItem(key) || '';
        }
      }
      return data;
    });

    // Save authenticated state (includes localStorage and cookies)
    await context.storageState({ path: storageState as string });

    // Also save sessionStorage separately
    const fs = require('fs');
    const sessionStoragePath = (storageState as string).replace('.json', '-session.json');
    fs.writeFileSync(sessionStoragePath, JSON.stringify(sessionStorageData, null, 2));

    console.log('✓ Authentication state saved to:', storageState);
    console.log('✓ Session storage saved to:', sessionStoragePath);
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;
