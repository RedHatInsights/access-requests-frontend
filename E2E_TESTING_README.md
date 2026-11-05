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

**IMPORTANT:** Some features like TAM (Technical Account Manager) invites require the internal view to be enabled. The override only changes the frontend view; backend authorization still uses the real identity.

### The Internal User Fixture

Use `playwright/fixtures/internal-user-fixture.ts` for tests needing internal access:

```typescript
import { test, expect } from '../fixtures/internal-user-fixture';

test('TAM invite workflow', async ({ internalUserPage }) => {
  // internalUserPage has the UI override set before loading the app
  await internalUserPage.goto('/iam/my-user-access');
  // Internal-only features are now visible!
});
```

**Why This is Needed:**
- The test account cannot be marked internal in the Chrome user identity.
- The standalone app uses `chrome.auth.getUser()` to select its internal or external view; the federated pages also receive `isInternal` from the RBAC host. The override must apply to both.

**What the Fixture Does:**
1. Performs SSO login with real credentials.
2. Sets `localStorage.setItem('access-requests:force-internal-user', 'true')` on the console origin.
3. Navigates to Access Requests, where both standalone and federated page views read the flag.

To enable the internal view manually, set the same key on the console origin and reload; remove the key and reload to restore the normal view. Only the exact value `true` enables it. This does **not** modify tokens, Chrome identity, or server permissions; server-side actions can still fail if the test account lacks authorization.

See `playwright/fixtures/internal-user-fixture.ts` for detailed technical explanation.

## Architecture

### Test Files
```
playwright/
├── e2e/
│   └── tam-invite-hybrid.spec.ts    # TAM invite E2E test
├── fixtures/
│   └── internal-user-fixture.ts     # SSO login and internal-only UI access
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

### Authentication Flow

The `internalUserPage` fixture performs SSO login for each test that uses it:

1. Navigate to Red Hat SSO login page
2. Fill username and handle email modal if present
3. Fill password and submit
4. Handle internal Kerberos SSO page (fills same credentials again)
5. Read the OIDC user state and retain its signed tokens
6. Set `profile.is_internal: true` in the browser-side OIDC profile
7. Set the `cs_jwt` cookie from the SSO access token for the app under test
8. Reload and verify the session

The PR pipeline sets `BASE_URL` to `https://stage.foo.redhat.com:1337`, which serves the PR-built app and proxies its API requests to Stage.

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
