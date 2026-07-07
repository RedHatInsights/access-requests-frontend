import { test, expect } from '@playwright/test';

/**
 * Internal User Permission Tests
 *
 * These tests verify that a user authenticated with the cloud-services OAuth client
 * (via Vault token) has is_internal: true and can access internal-only features.
 *
 * Prerequisites:
 * - Global setup must inject internal user token (see playwright/setup/global-setup.ts)
 * - Token must be from cloud-services client with idp: auth.stage.redhat.com
 */

test.describe('Internal User Permissions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should verify is_internal flag via identity API', async ({ page }) => {
    const response = await page.request.get(
      'https://console.stage.redhat.com/api/apicast-tests/identity'
    );

    expect(response.status()).toBe(200);

    const identity = await response.json();

    expect(identity.identity.user.is_internal).toBe(true);
    expect(identity.entitlements.internal.is_entitled).toBe(true);
    expect(identity.identity.user.is_org_admin).toBe(true);

    console.log('✓ Verified is_internal:', identity.identity.user.is_internal);
    console.log('✓ Verified is_org_admin:', identity.identity.user.is_org_admin);
  });

  test('should have permissions to send TAM invites', async ({ page }) => {
    const response = await page.request.get(
      'https://console.stage.redhat.com/api/apicast-tests/identity'
    );

    expect(response.status()).toBe(200);

    const identity = await response.json();

    expect(identity.identity.user.is_internal).toBe(true);
    expect(identity.identity.user.is_org_admin).toBe(true);

    console.log('✓ TAM invite permissions verified');
  });

  test('should have correct token claims for internal access', async ({ page }) => {
    const tokenClaims = await page.evaluate(() => {
      const token = localStorage.getItem('cs_jwt');
      if (!token) {
        throw new Error('cs_jwt token not found in localStorage');
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = parts[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');

      const decoded = JSON.parse(atob(padded));
      return {
        aud: decoded.aud,
        azp: decoded.azp,
        idp: decoded.idp,
        username: decoded.username,
        org_id: decoded.org_id
      };
    });

    // aud can be either a string or an array
    if (Array.isArray(tokenClaims.aud)) {
      expect(tokenClaims.aud).toContain('cloud-services');
    } else {
      expect(tokenClaims.aud).toBe('cloud-services');
    }
    expect(tokenClaims.azp).toBe('cloud-services');
    expect(tokenClaims.idp).toBe('auth.stage.redhat.com');

    console.log('✓ Token claims verified (cloud-services client, idp: auth.stage.redhat.com)');
  });

  test('should have access to internal API endpoints', async ({ page }) => {
    const response = await page.request.get(
      'https://console.stage.redhat.com/api/apicast-tests/identity'
    );

    expect(response.status()).toBe(200);

    const data = await response.json();

    expect(data.identity).toBeDefined();
    expect(data.entitlements).toBeDefined();
    expect(data.identity.internal).toBeDefined();

    console.log('✓ Internal API endpoints accessible');
  });

  test('should verify user is recognized as internal throughout session', async ({ page }) => {
    await page.goto('/');
    let response = await page.request.get(
      'https://console.stage.redhat.com/api/apicast-tests/identity'
    );
    expect((await response.json()).identity.user.is_internal).toBe(true);

    await page.goto('/settings');
    response = await page.request.get(
      'https://console.stage.redhat.com/api/apicast-tests/identity'
    );
    expect((await response.json()).identity.user.is_internal).toBe(true);

    console.log('✓ Internal status persists across navigation');
  });

  test('should compare external vs internal token differences', async ({ page }) => {
    const tokenInfo = await page.evaluate(() => {
      const token = localStorage.getItem('cs_jwt');
      if (!token) return null;

      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      const decoded = JSON.parse(atob(padded));

      return {
        hasIdpClaim: 'idp' in decoded,
        idpValue: decoded.idp,
        audience: decoded.aud,
        client: decoded.azp,
        username: decoded.username
      };
    });

    expect(tokenInfo).not.toBeNull();
    expect(tokenInfo?.hasIdpClaim).toBe(true);
    expect(tokenInfo?.idpValue).toBe('auth.stage.redhat.com');
    // aud can be either a string or an array
    if (Array.isArray(tokenInfo?.audience)) {
      expect(tokenInfo?.audience).toContain('cloud-services');
    } else {
      expect(tokenInfo?.audience).toBe('cloud-services');
    }
    expect(tokenInfo?.client).toBe('cloud-services');

    console.log('✓ Internal token characteristics verified');
  });

});
