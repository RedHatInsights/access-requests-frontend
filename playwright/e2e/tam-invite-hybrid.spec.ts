/// <reference path="../types/window.d.ts" />

import { test, expect } from '../fixtures/internal-user-fixture';

/**
 * TAM Invite E2E Test
 *
 * Tests the complete TAM (Technical Account Manager) invite workflow including:
 * - Button visibility with is_internal: true (ONLY visible to internal users)
 * - Form submission (3-step wizard)
 * - Request verification in table
 *
 * WHY THIS TEST USES THE INTERNAL USER FIXTURE:
 * ==============================================
 * The TAM invite feature is INTERNAL-USER-ONLY. Without is_internal: true:
 * - The "Create request" button does not appear
 * - Backend TAM APIs reject the requests
 * - The entire workflow is inaccessible
 *
 * The `internalUserPage` fixture from internal-user-fixture.ts:
 * - Creates a browser context with chrome.auth.getUser() override
 * - Swaps the OIDC token to set profile.is_internal: true
 * - Ensures the TAM workflow is accessible
 *
 * See playwright/fixtures/internal-user-fixture.ts for implementation details.
 */

//=============================================================================
// Configuration Constants
//=============================================================================

const CONFIG = {
  vault: {
    addr: process.env.VAULT_ADDR || 'https://vault.devshift.net',
    path: 'insights/secrets/qe/stage/users/idp_internal_user',
  },
  console: {
    url: 'https://console.stage.redhat.com',
    ssoUrl: 'sso.stage.redhat.com',
  },
  proxy: {
    server: 'http://squid.corp.redhat.com:3128',
  },
  test: {
    timeout: 180_000, // 3 minutes
    orgId: process.env.TAM_INVITE_ORG_ID || '1178977', // Target org for TAM access request
  },
} as const;

//=============================================================================
// Timeout Constants (in milliseconds)
//=============================================================================

const TIMEOUTS = {
  // Page navigation
  PAGE_LOAD: 60_000,
  SSO_REDIRECT: 30_000,
  SSO_STAGE: 15_000,

  // Authentication
  OIDC_INIT: 2_000,
  CHROME_REINIT: 5_000,

  // UI interactions
  MODAL_OPEN: 2_000,
  MODAL_TRANSITION: 2_000,
  NAV_EXPAND: 1_000,
  NAV_CLICK: 2_000,
  FEDERATED_MODULE: 10_000,
  FORM_SUBMIT: 3_000,
  TABLE_REFRESH: 2_000,

  // Chrome override polling
  OVERRIDE_POLL_INTERVAL: 50,
  OVERRIDE_POLL_TIMEOUT: 30_000,
} as const;

//=============================================================================
// Locator Selectors (Semantic)
//=============================================================================

const SELECTORS = {
  // SSO Login
  sso: {
    usernameInput: 'input[name="username"]',
    passwordInput: 'input[name="password"]',
    nextButton: 'button:has-text("Next"), input[type="submit"]',
    submitButton: 'input[type="submit"], button[type="submit"]',
    greeting: 'text=Hi,',
  },

  // Navigation
  nav: {
    userAccessButton: 'nav button#user-access',
    accessRequestsLink: 'nav a:has-text("Red Hat Access Request")',
  },

  // TAM Invite
  tamInvite: {
    createButton: 'button:has-text("Create request")',
    modal: '[role="dialog"].pf-v6-c-wizard',
  },

  // Wizard Form
  wizard: {
    firstNameInput: 'input[id*="first-name"], input[id*="firstName"]',
    lastNameInput: 'input[id*="last-name"], input[id*="lastName"]',
    orgIdInput: 'input[placeholder*="1234567"]',
    dateInput: 'input[placeholder="mm/dd/yyyy"]',
    roleCheckbox: 'input[type="checkbox"]:visible',
    nextButton: 'button:has-text("Next")',
    submitButton: 'button:has-text("Submit"), button:has-text("Create")',
  },

  // API
  api: {
    identity: '/api/apicast-tests/identity',
  },
} as const;

//=============================================================================
// Screenshot Paths
//=============================================================================

const SCREENSHOTS = {
  step1Initial: 'playwright/test-results/tam-invite-step1-initial.png',
  step1Filled: 'playwright/test-results/tam-invite-step1-filled.png',
  step2Initial: 'playwright/test-results/tam-invite-step2-initial.png',
  step2Filled: 'playwright/test-results/tam-invite-step2-filled.png',
  step3Review: 'playwright/test-results/tam-invite-step3-review.png',
  submitted: 'playwright/test-results/tam-invite-submitted.png',
} as const;

//=============================================================================
// Test Data
//=============================================================================

const TEST_DATA = {
  get orgId() { return CONFIG.test.orgId; },
  getRequestName: () => `E2E Test - ${Date.now()}`,
  getAccessDates: () => {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    const end = new Date();
    end.setDate(end.getDate() + 8);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  },
} as const;

//=============================================================================
// Test Suite
//=============================================================================

test.describe('TAM Invite - E2E Workflow', () => {
  test('should complete TAM invite workflow with is_internal override', async ({ internalUserPage: page }) => {
    test.setTimeout(CONFIG.test.timeout);

    // The internalUserPage fixture has already:
    // - Created a browser context with TWO-LAYER chrome.auth override
    // - Swapped the OIDC token to set is_internal: true
    // - Verified the session is valid
    // We can now proceed directly to testing the TAM workflow

    //=======================================================================
    // Step 1: Verify Identity (is_internal: true)
    //=======================================================================

    const identity = await page.request.get(SELECTORS.api.identity).then(r => r.json());
    expect(identity.identity.user.is_internal).toBe(true);
    expect(identity.identity.user.is_org_admin).toBe(true);

    //=======================================================================
    // Step 2: Navigate to TAM Invite Page
    //=======================================================================

    await page.goto('/iam/my-user-access', {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.PAGE_LOAD
    });
    await page.waitForTimeout(TIMEOUTS.FEDERATED_MODULE);

    // Expand navigation
    const userAccessButton = page.locator(SELECTORS.nav.userAccessButton).first();
    if (await userAccessButton.isVisible()) {
      await userAccessButton.click();
      await page.waitForTimeout(TIMEOUTS.NAV_EXPAND);
    }

    // Click "Red Hat Access Requests"
    const accessRequestsLink = page.locator(SELECTORS.nav.accessRequestsLink).first();
    if (await accessRequestsLink.isVisible()) {
      await accessRequestsLink.click();
      await page.waitForTimeout(TIMEOUTS.NAV_CLICK);
    }

      //=======================================================================
      // Step 3: Verify Button and Test Workflow
      //=======================================================================


      // Verify chrome.auth.getUser() returns is_internal: true
      const chromeUser = await page.evaluate(async () => {
        if (window.insights?.chrome?.auth?.getUser) {
          const user = await window.insights.chrome.auth.getUser();
          return {
            is_internal: user?.identity?.user?.is_internal,
            is_org_admin: user?.identity?.user?.is_org_admin
          };
        }
        return null;
      });

      expect(chromeUser?.is_internal).toBe(true);

      // Find and click "Create request" button
      const createButton = page.locator(SELECTORS.tamInvite.createButton);
      await expect(createButton).toBeVisible();

      await createButton.click();
      await page.waitForTimeout(TIMEOUTS.MODAL_OPEN);

      // Verify modal opened
      const modal = page.locator(SELECTORS.tamInvite.modal);
      await expect(modal).toBeVisible();

      await page.screenshot({ path: SCREENSHOTS.step1Initial, fullPage: true });

      //=======================================================================
      // Step 4: Fill Form - Step 1 (Request Details)
      //=======================================================================


      // Fill Organization ID (required field)
      await modal.locator(SELECTORS.wizard.orgIdInput).first().fill(TEST_DATA.orgId);

      // Fill dates if inputs are visible
      const dateInputs = modal.locator(SELECTORS.wizard.dateInput);
      const dateCount = await dateInputs.count();
      if (dateCount >= 2) {
        const dates = TEST_DATA.getAccessDates();
        // Convert YYYY-MM-DD to MM/DD/YYYY format
        const startDate = new Date(dates.start);
        const endDate = new Date(dates.end);
        const formatDate = (d: Date) =>
          `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;

        await dateInputs.nth(0).fill(formatDate(startDate));
        await dateInputs.nth(1).fill(formatDate(endDate));
      }

      await page.screenshot({ path: SCREENSHOTS.step1Filled, fullPage: true });
      await modal.locator(SELECTORS.wizard.nextButton).click();
      await page.waitForTimeout(TIMEOUTS.MODAL_TRANSITION);

      //=======================================================================
      // Step 5: Fill Form - Step 2 (Select Roles)
      //=======================================================================


      await page.screenshot({ path: SCREENSHOTS.step2Initial, fullPage: true });

      // Select at least one role (find checkboxes within the table rows, skip the header bulk-select)
      const roleRows = modal.locator('table tbody tr, [role="grid"] [role="row"]');
      const firstRoleCheckbox = roleRows.first().locator('input[type="checkbox"]');

      if (await firstRoleCheckbox.isVisible({ timeout: TIMEOUTS.MODAL_TRANSITION }).catch(() => false)) {
        await firstRoleCheckbox.click();
      }

      await page.screenshot({ path: SCREENSHOTS.step2Filled, fullPage: true });
      await modal.locator(SELECTORS.wizard.nextButton).click();
      await page.waitForTimeout(TIMEOUTS.MODAL_TRANSITION);

      //=======================================================================
      // Step 6: Review and Submit
      //=======================================================================


      await page.screenshot({ path: SCREENSHOTS.step3Review, fullPage: true });

      const submitButton = modal.locator(SELECTORS.wizard.submitButton);
      if (await submitButton.isVisible()) {
        await submitButton.click();

        await page.waitForTimeout(TIMEOUTS.FORM_SUBMIT);

        if (!await modal.isVisible().catch(() => true)) {
        }
      }

      //=======================================================================
      // Step 7: Verify Request in Table
      //=======================================================================


      await page.waitForTimeout(TIMEOUTS.TABLE_REFRESH);

      // Try multiple strategies to find the request
      let requestFound = false;

      // Strategy 1: Look for the org ID in the table
      const orgIdCell = page.locator(`td:has-text("${TEST_DATA.orgId}"), [role="cell"]:has-text("${TEST_DATA.orgId}")`).first();
      if (await orgIdCell.isVisible({ timeout: 5000 }).catch(() => false)) {
        requestFound = true;

        // Get the full row to check status
        const row = orgIdCell.locator('..');
        const rowText = await row.textContent();

        if (rowText?.toLowerCase().includes('pending') || rowText?.toLowerCase().includes('submitted')) {
        }
      }

      // Strategy 2: Check if the first row is our newly created request (it should be at the top)
      if (!requestFound) {
        const firstRow = page.locator('table tbody tr, [role="row"]').first();
        const firstRowText = await firstRow.textContent().catch(() => '');

        if (firstRowText?.includes(TEST_DATA.orgId)) {
          requestFound = true;
        }
      }

      if (!requestFound) {
        const tableRows = page.locator('table tbody tr, [role="row"]');
        const rowCount = await tableRows.count();

        for (let i = 0; i < Math.min(rowCount, 5); i++) {
          const rowText = await tableRows.nth(i).textContent();
        }
      }

      await page.screenshot({ path: SCREENSHOTS.submitted, fullPage: true });

      // Assert that we found the request
      expect(requestFound, 'Request should appear in the table after submission').toBe(true);

  });
});
