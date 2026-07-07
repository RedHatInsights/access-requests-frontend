# E2E Testing Setup for Access Requests Frontend

This document describes the E2E test infrastructure adapted from the 3scale-interaction proof of concept, now using environment variable-based authentication.

## Files Copied

### Test Infrastructure

```
playwright/
├── e2e/
│   ├── tam-invite-hybrid.spec.ts    # Main TAM invite E2E test
│   └── internal-user.spec.ts        # Internal user permission validation test
├── setup/
│   └── global-setup.ts              # Global setup - performs real SSO login
├── fixtures/
│   └── auth-fixture.ts              # Restores sessionStorage for tests
├── types/
│   └── window.d.ts                  # TypeScript definitions for window.insights
└── tsconfig.json                    # Playwright TypeScript config
```

### Configuration & Scripts

```
playwright.config.ts                 # Playwright configuration
bin/
├── run_tam_invite_test.sh          # Helper script with auto-authentication
└── load_internal_user_token.sh     # Manual token retrieval script
```

### Dependencies Added

Added to `package.json` devDependencies:
- `@playwright/test: ^1.40.0`
- `@types/node: ^20.10.0`

**Note**: Vault dependencies (`node-vault`) have been removed in favor of environment variable authentication.

## What May Need Adaptation

### 1. Test Configuration (`playwright.config.ts`)

The test is currently configured for:
- **Base URL**: `https://console.stage.redhat.com`
- **Test path**: `/iam/user-access/access-requests`
- **Proxy**: `http://squid.corp.redhat.com:3128`

**If your frontend is deployed at a different path**, update:
```typescript
// In playwright.config.ts
use: {
  baseURL: 'https://console.stage.redhat.com',  // Your console URL
  // ...
}

// In tam-invite-hybrid.spec.ts, CONFIG section
const CONFIG = {
  console: {
    url: 'https://console.stage.redhat.com',    // Your console URL
    ssoUrl: 'sso.stage.redhat.com',
  },
  // ...
}
```

### 2. Navigation Selectors (`tam-invite-hybrid.spec.ts`)

The test navigates using these selectors:
```typescript
const SELECTORS = {
  nav: {
    userAccessButton: 'nav button#user-access',
    accessRequestsLink: 'nav a:has-text("Red Hat Access Request")',
  },
  // ...
}
```

**If your navigation structure differs**, update these selectors to match your app's navigation.

### 3. Organization ID

The test uses a default org ID for testing:
```typescript
const CONFIG = {
  test: {
    orgId: process.env.TAM_INVITE_ORG_ID || '1178977',
  },
}
```

**To test with a different organization**, set the environment variable:
```bash
TAM_INVITE_ORG_ID=1234567 bash bin/run_tam_invite_test.sh
```

### 4. Form Field Selectors

The test expects this form structure:
- **Step 1**: Organization ID input, Access date inputs (MM/DD/YYYY format)
- **Step 2**: Role selection table with checkboxes
- **Step 3**: Review and submit

**If your form has different fields or structure**, update the selectors in:
```typescript
const SELECTORS = {
  wizard: {
    firstNameInput: 'input[id*="first-name"], input[id*="firstName"]',
    lastNameInput: 'input[id*="last-name"], input[id*="lastName"]',
    orgIdInput: 'input[placeholder*="1234567"]',
    dateInput: 'input[placeholder="mm/dd/yyyy"]',
    roleCheckbox: 'input[type="checkbox"]:visible',
    nextButton: 'button:has-text("Next")',
    submitButton: 'button:has-text("Submit"), button:has-text("Create")',
  },
}
```

## Authentication Implementation

### Environment Variable Approach

The tests use `E2E_USER` and `E2E_PASSWORD` environment variables instead of Vault:

**Local Development:**
```bash
export E2E_USER=your-redhat-username
export E2E_PASSWORD=your-password
npx playwright test
```

**CI/CD:**
- Credentials provided by Konflux ExternalSecret
- No VPN or Vault access required

### How Global Setup Works

The `playwright/setup/global-setup.ts` performs these steps:

1. **SSO Login Flow**:
   - Navigate to Red Hat SSO OAuth endpoint
   - Fill username → handle email modal → fill password
   - Handle internal Kerberos SSO page (uses same credentials)
   - Wait for OAuth callback redirect

2. **Token Extraction**:
   - Extract `cs_jwt` cookie from authenticated session
   - Close login context

3. **Auth Context Setup** (Critical order):
   - Create NEW browser context
   - Set cookie with `domain: '.stage.redhat.com', path: '/'` BEFORE navigation
   - Navigate to console with cookie already set
   - This ensures cookie is available for ALL API calls

4. **OIDC State Injection**:
   - Decode JWT token to get claims
   - Inject token into localStorage
   - Create OIDC user object in sessionStorage
   - Save sessionStorage separately (Playwright only saves localStorage/cookies)

5. **Verification**:
   - Call identity API to verify `is_internal: true`
   - Save authenticated state to `.auth/internal-user.json` and `-session.json`

### Key Implementation Notes

**Cookie Configuration** (playwright/setup/global-setup.ts:194-203):
```javascript
await context.addCookies([{
  name: 'cs_jwt',
  value: token,
  domain: '.stage.redhat.com',  // Leading dot for all subdomains
  path: '/',                      // Must be / not specific paths
  httpOnly: false,
  secure: true,
  sameSite: 'None'
}]);
```

**Proxy Configuration** (playwright.config.ts and global-setup.ts):
- Local: Uses `http://squid.corp.redhat.com:3128`
- CI: No proxy (auto-detected via `CI` env var)

**SessionStorage Persistence** (playwright/setup/global-setup.ts:289-292):
- Manually captured and saved to `.auth/internal-user-session.json`
- Restored by `auth-fixture.ts` before each test

## Running the Tests

### Prerequisites

1. **Local Development**:
   - Red Hat VPN connection required
   - E2E credentials (E2E_USER and E2E_PASSWORD)

2. **CI/CD**:
   - No VPN required
   - Credentials from ExternalSecret

### Quick Start

```bash
# Run the test (visible browser - see what happens!)
bash bin/run_tam_invite_test.sh

# Other modes:
bash bin/run_tam_invite_test.sh --headed    # Visible browser (default)
bash bin/run_tam_invite_test.sh --headless  # Background mode (CI)
bash bin/run_tam_invite_test.sh --debug     # Step-by-step debugging
bash bin/run_tam_invite_test.sh --ui        # Interactive test explorer
```

The script automatically:
- ✓ Checks for Vault CLI installation
- ✓ Authenticates with Vault if needed (opens browser for SSO)
- ✓ Verifies access to the required secret
- ✓ Runs the Playwright test
- ✓ Shows colored pass/fail status

## How the Test Works

### Authentication Strategy

The test uses a **hybrid authentication approach**:

1. **Real SSO Login** - Creates a valid OIDC session
2. **Token Swap** - Replaces OIDC token with Vault internal user token
3. **chrome.auth.getUser() Override** - Forces `is_internal: true` before React components mount

### Test Flow (9 Steps)

1. **Vault Authentication** - Gets internal user token
2. **SSO Login** - Two-stage authentication (SSO + Kerberos)
3. **OIDC Token Swap** - Swaps session with internal user token
4. **Identity Verification** - Confirms `is_internal: true` and `is_org_admin: true`
5. **Navigation** - Navigates to TAM invite page
6. **Form Step 1** - Fills organization ID and access dates
7. **Form Step 2** - Selects at least one role
8. **Review & Submit** - Reviews and submits the request
9. **Table Verification** - Confirms request appears in the table

### Why the Override is Needed

- Normal SSO login returns `is_internal: false` in JWT claims
- 3scale API gateway injects `is_internal: true` in API responses (when token has `idp: auth.stage.redhat.com`)
- BUT the frontend button reads from `chrome.auth.getUser()` which reads JWT claims directly
- The override ensures `chrome.auth.getUser()` returns `is_internal: true` before React components mount and cache the user

## Vault Integration

The test uses `playwright/vault-client.ts` to:
1. Read Vault token from `~/.vault-token` (same as Vault CLI)
2. Fetch the refresh token (`ocm_token`) from Vault
3. Exchange it for an access token via SSO

This replaces the old bash-based approach with a pure TypeScript solution using HashiCorp's `node-vault` package.

## CI/CD Integration

To integrate into your CI/CD pipeline:

1. **Install Playwright**: Add to your CI config
   ```bash
   npx playwright install chromium
   ```

2. **Vault Authentication**: Configure Vault access in CI
   - Set `VAULT_ADDR=https://vault.devshift.net`
   - Provide Vault token via CI secrets

3. **Run Tests**: 
   ```bash
   VAULT_ADDR=https://vault.devshift.net npx playwright test
   ```

## Troubleshooting

### "Vault token expired"
Run: `vault login -method=oidc`

### "Cannot access Vault secret"
Verify you have read access to: `insights/secrets/qe/stage/users/idp_internal_user`

### "Button not found"
Check if:
1. The navigation path is correct
2. The button selector matches your UI
3. The override fired before React mounted (check screenshots in test-results/)

### "Modal selector found 2 elements"
Update the modal selector to be more specific (currently uses `[role="dialog"].pf-v6-c-wizard`)

## Next Steps

1. **Adapt selectors** to match your actual UI structure
2. **Configure CI/CD** to run tests in your pipeline
3. **Add more test cases** for different workflows
4. **Update documentation** with your specific setup

## Reference Documentation

See the original investigation repository for detailed technical docs:
- Complete authentication flow explanation
- Chrome override technical details
- Playwright best practices
- Troubleshooting guide

---

**Status**: Ready for adaptation to your frontend
**Last Updated**: 2026-07-01
