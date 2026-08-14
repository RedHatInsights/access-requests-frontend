# Access Requests Frontend - Claude Instructions

## E2E Testing Architecture

### Authentication Approach (IMPORTANT)

The E2E tests use **environment variable-based authentication** instead of Vault:

- **Global setup** (`playwright/setup/global-setup.ts`) performs real SSO login using `E2E_USER` and `E2E_PASSWORD`
- The login flow authenticates through Red Hat SSO and extracts a JWT token
- The token is set as a cookie with specific domain/path configuration
- OIDC state is injected into sessionStorage for react-oidc-context

### Internal User Fixture - For Testing Internal-Only Features (CRITICAL)

**DO NOT REMOVE THE INTERNAL-USER-FIXTURE!**

The TAM (Technical Account Manager) invite workflow and other internal-only features **require** `is_internal: true` to work:

1. **Why Internal User Access is Needed:**
   - Features like "Create TAM request" are only visible to internal Red Hat users
   - Backend APIs check `is_internal: true` and reject requests without it
   - Without this flag, entire workflows are inaccessible in tests

2. **The Problem:**
   - JWT tokens from SSO login have `is_internal: false` in claims (even for internal users)
   - The 3scale API gateway injects `is_internal: true` in API responses
   - BUT the frontend reads `chrome.auth.getUser()` which reads JWT claims directly
   - React components cache this user object before API calls complete

3. **The Solution - Internal User Fixture:**
   - Use `playwright/fixtures/internal-user-fixture.ts` for tests needing internal access
   - The fixture performs SSO login and swaps the OIDC token with `is_internal: true`
   - TWO-LAYER override ensures `is_internal: true` persists across navigations:
     - **Layer 1**: `Storage.prototype.getItem` - intercepts ALL localStorage reads for OIDC keys
     - **Layer 2**: `chrome.auth.getUser()` - wraps the function to inject `is_internal: true`
   - Returns an `internalUserPage` ready to test internal-only features

4. **Usage:**
   ```typescript
   import { test, expect } from '../fixtures/internal-user-fixture';
   
   test('my internal feature test', async ({ internalUserPage }) => {
     await internalUserPage.goto('/iam/my-user-access');
     // Internal-only buttons and features are now visible!
   });
   ```

5. **Why This Can't Be Removed:**
   - The token swap is essential for internal-only features to work
   - The TWO-LAYER override is critical to maintain `is_internal: true` across page navigations
   - Layer 1 (Storage.prototype) ensures every localStorage read returns the override
   - Layer 2 (chrome.auth) ensures the frontend API also returns the override
   - This is not "legacy code" - it's a necessary workaround for JWT/API mismatch

**Files:**
- `playwright/fixtures/internal-user-fixture.ts` - The reusable fixture with SSO login + token swap
- `playwright/e2e/tam-invite-hybrid.spec.ts` - Example usage

### Key Implementation Details

#### 1. Cookie Setup (Critical for API Access)

The `cs_jwt` cookie MUST be set with:
```javascript
{
  name: 'cs_jwt',
  value: token,
  domain: '.stage.redhat.com',  // Note the leading dot for all subdomains
  path: '/',                      // Must be / for all API endpoints
  httpOnly: false,
  secure: true,
  sameSite: 'None'
}
```

**Why this matters**: The login flow sets cookies with specific paths (e.g., `/api/edge/v1`), but API calls to `/api/apicast-tests/identity` need `path: '/'`.

#### 2. Context Setup Order (Critical)

The global-setup MUST:
1. Perform login and extract token
2. **Close the login context**
3. **Create a NEW context with the cookie already set** (via `context.addCookies()`)
4. **Then navigate to the app**

This matches the proof-of-concept pattern. Setting the cookie BEFORE navigation ensures it's available for all requests.

#### 3. SessionStorage Persistence

Playwright's `storageState` only saves localStorage and cookies, NOT sessionStorage. We must:
1. Capture sessionStorage manually with `page.evaluate()`
2. Save it to `.auth/internal-user-session.json`
3. The `auth-fixture.ts` restores it before each test

#### 4. Proxy Configuration (Local Development)

For local development against stage environment:
- Tests require Red Hat VPN and proxy (`http://squid.corp.redhat.com:3128`)
- Proxy is auto-configured when `CI` env var is NOT set
- In CI, proxy is disabled (not needed)

This is configured in:
- `playwright/setup/global-setup.ts` - for the global setup
- `playwright.config.ts` - for the test runs

#### 5. Login Flow Steps

The authentication handles these SSO pages:
1. Initial username entry
2. Email linking modal (dismiss with "Next" button)
3. Password field (waits for visibility)
4. Internal SSO/Kerberos page (fills same credentials again)
5. OAuth callback redirect

Each step has screenshots saved to `playwright/test-results/setup-*.png` for debugging.

## Common Issues and Solutions

### Password field not found
- The field may be hidden by a modal popup
- Check for "Link your email" or similar modals
- Use `.waitFor({ state: 'visible' })` not just existence checks

### API calls return 403
- Cookie not set with correct domain/path
- Proxy not configured for local development
- Context created without preset cookies

### Tests pass in global-setup but fail in tests
- sessionStorage not being restored (check auth-fixture usage)
- Proxy missing from `playwright.config.ts`
- StorageState file not being loaded

### Token claims differ from expectations
- The `aud` claim can be a string OR an array
- Always check `if (Array.isArray(tokenClaims.aud))` before assertions

## File Locations

- **Global setup**: `playwright/setup/global-setup.ts`
- **Auth fixture**: `playwright/fixtures/auth-fixture.ts`
- **Config**: `playwright.config.ts`
- **Tests**: `playwright/e2e/*.spec.ts`
- **Auth state**: `playwright/.auth/internal-user.json` and `internal-user-session.json`
- **Screenshots**: `playwright/test-results/setup-*.png`

## Environment Variables

Required for running tests:
- `E2E_USER` - Red Hat SSO username
- `E2E_PASSWORD` - Red Hat SSO password
- `CI` - Set in CI environment to disable proxy

Optional:
- `BASE_URL` - Override default console.stage.redhat.com

## Documentation

- `E2E_TESTING_README.md` - Overview and quick start
- `E2E_TESTING_SETUP.md` - Detailed setup instructions
- `TEKTON_PIPELINE_SETUP.md` - CI/CD pipeline configuration
