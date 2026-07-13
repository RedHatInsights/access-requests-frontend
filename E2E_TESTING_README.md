# E2E Testing for Access Requests Frontend

End-to-end testing using Playwright with environment variable-based authentication.

## Overview

The E2E tests authenticate using real Red Hat SSO login with credentials provided via environment variables:
- **Locally**: Set `E2E_USER` and `E2E_PASSWORD` manually
- **CI**: Provided by ExternalSecret in Konflux pipeline

## Quick Start

### Running Tests Locally

1. **Prerequisites**
   - Connected to Red Hat VPN (tests use squid proxy)
   - Valid Red Hat credentials

2. **Set environment variables**
   ```bash
   export E2E_USER=your-redhat-username
   export E2E_PASSWORD=your-password
   ```

3. **Run tests**
   ```bash
   npx playwright test
   ```

See **[E2E_TESTING_LOCAL.md](E2E_TESTING_LOCAL.md)** for detailed local testing guide.

## Testing Internal-Only Features

**IMPORTANT:** Some features like TAM (Technical Account Manager) invites require `is_internal: true` to work.

### The Internal User Fixture

Use `playwright/fixtures/internal-user-fixture.ts` for tests needing internal access:

```typescript
import { test, expect } from '../fixtures/internal-user-fixture';

test('TAM invite workflow', async ({ internalUserPage }) => {
  // internalUserPage has is_internal: true already set
  await internalUserPage.goto('/iam/my-user-access');
  // Internal-only features are now visible!
});
```

**Why This is Needed:**
- JWT tokens from SSO have `is_internal: false` even for internal users
- The 3scale API gateway injects `is_internal: true` in API responses
- BUT the frontend reads `chrome.auth.getUser()` which reads JWT claims directly
- React components cache this user object before API calls complete

**What the Fixture Does:**
1. Performs SSO login and extracts the JWT token
2. Swaps the OIDC token to set `profile.is_internal: true`
3. Uses a TWO-LAYER override to ensure `is_internal: true` persists:
   - Layer 1: `Storage.prototype.getItem` - intercepts localStorage reads
   - Layer 2: `chrome.auth.getUser()` - wraps the function directly
4. Returns a page ready to test internal-only features

**⚠️ DO NOT REMOVE THIS FIXTURE** - It's essential for testing internal-only features.

See `playwright/fixtures/internal-user-fixture.ts` for detailed technical explanation.

## Architecture

### Test Files
```
playwright/
├── e2e/
│   └── tam-invite-hybrid.spec.ts    # TAM invite E2E test
├── setup/
│   └── global-setup.ts              # SSO authentication
├── fixtures/
│   └── internal-user-fixture.ts     # Internal user access
├── types/
│   └── window.d.ts                  # TypeScript definitions
└── tsconfig.json                    # Playwright config
```

### Configuration
- `playwright.config.ts` - Playwright configuration
- `.tekton/access-requests-frontend-pull-request.yaml` - CI/CD pipeline

### Dependencies
- `@playwright/test: ^1.61.1`
- `@types/node: ^20.10.0`
- `@redhat-cloud-services/playwright-test-auth` - Cookie consent handling

## How Authentication Works

### Global Setup Flow

The `playwright/setup/global-setup.ts` performs real SSO login once before all tests:

1. Navigate to Red Hat SSO login page
2. Fill username and handle email modal if present
3. Fill password and submit
4. Handle internal Kerberos SSO page (fills same credentials again)
5. Extract `cs_jwt` token from OAuth callback
6. Create new browser context with token preset
7. Inject OIDC state into sessionStorage for react-oidc-context
8. Verify authentication via identity API
9. Save authenticated state to `.auth/internal-user.json`

Duration: ~30-45 seconds for initial setup, then cached for subsequent runs.

### Cookie Configuration

The `cs_jwt` cookie must be set with specific configuration:
```javascript
{
  domain: '.stage.redhat.com',  // Leading dot for all subdomains
  path: '/',                     // Root path for all API endpoints
  secure: true,
  sameSite: 'None'
}
```

## CI/CD Integration

The E2E tests run in the Konflux pipeline:

1. **Credentials**: Provided by ExternalSecret (`access-requests-frontend-credentials-secret`)
2. **Environment**: stage.foo.redhat.com (no VPN/proxy needed)
3. **Sidecars**: 
   - `run-application` - Serves the built app with Caddy
   - `frontend-dev-proxy` - Proxies to stage environment

See `.tekton/access-requests-frontend-pull-request.yaml` for pipeline configuration.

## Environment Differences

| Aspect | Local | CI (Konflux) |
|--------|-------|--------------|
| Proxy | squid.corp.redhat.com:3128 | None |
| VPN | Required | Not needed |
| BASE_URL | console.stage.redhat.com | stage.foo.redhat.com:1337 |
| Credentials | Manual env vars | ExternalSecret |
| Parallelization | Yes (faster) | No (1 worker) |

## Troubleshooting

### Common Issues

**"cs_jwt token not found"**
- Global-setup authentication failed
- Check E2E_USER and E2E_PASSWORD are set correctly
- Run with `--headed` to see what's happening

**"ERR_PROXY_CONNECTION_FAILED"**
- Not on Red Hat VPN
- Connect to VPN and try again

**"Password field not found"**
- SSO page structure may have changed
- Check error screenshot: `playwright/test-results/setup-error-password-not-found.png`

### Error Screenshots

Global setup captures error screenshots for debugging:
- `setup-error-password-not-found.png` - Password field not found
- `setup-error-final.png` - Any other setup error

## Resources

- **[E2E_TESTING_LOCAL.md](E2E_TESTING_LOCAL.md)** - Local testing guide
- **[Playwright Documentation](https://playwright.dev/docs/intro)** - Official Playwright docs
- **[playwright/fixtures/internal-user-fixture.ts](playwright/fixtures/internal-user-fixture.ts)** - Internal user implementation details

---

**Last Updated**: 2026-07-08
