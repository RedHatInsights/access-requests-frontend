# E2E Testing for Access Requests Frontend

E2E testing infrastructure using Playwright with environment variable-based authentication (adapted from the 3scale-interaction proof of concept).

## Authentication Approach

The tests authenticate using **E2E_USER and E2E_PASSWORD** environment variables instead of Vault:
- **Locally**: Set environment variables manually
- **CI**: Provided by ExternalSecret (Konflux pipeline)

This approach eliminates the VPN requirement and works in both local and CI environments.

## Quick Links

- **[E2E_TESTING_SETUP.md](E2E_TESTING_SETUP.md)** - Complete setup guide, adaptation instructions, troubleshooting
- **[TEKTON_PIPELINE_SETUP.md](TEKTON_PIPELINE_SETUP.md)** - CI/CD pipeline configuration and setup

## What Was Added

### Test Infrastructure
```
playwright/
├── e2e/
│   ├── tam-invite-hybrid.spec.ts    # TAM invite E2E test (9 steps)
│   └── internal-user.spec.ts        # Internal user validation
├── setup/global-setup.ts            # Environment variable authentication
├── fixtures/auth-fixture.ts          # Auth fixture (restores sessionStorage)
├── types/window.d.ts                # TypeScript definitions
└── tsconfig.json                    # Playwright TypeScript config
```

### Helper Scripts
```
bin/
├── run_tam_invite_test.sh          # Auto-auth test runner
└── load_internal_user_token.sh     # Manual token retrieval
```

### Configuration
- `playwright.config.ts` - Playwright configuration
- `.tekton/access-requests-frontend-pull-request-with-e2e.yaml` - CI/CD pipeline with E2E

### Dependencies (added to package.json)
- `@playwright/test: ^1.40.0`
- `@types/node: ^20.10.0`

## Quick Start

### Local Testing

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables (get credentials from your team)
export E2E_USER=your-username
export E2E_PASSWORD=your-password

# 3. Run the tests
npx playwright test
```

**Important for Local Development:**
- Tests require the Red Hat VPN and proxy (`http://squid.corp.redhat.com:3128`)
- The proxy is automatically configured for local runs (when `CI` env var is not set)
- In CI, the proxy is disabled and not needed

### CI/CD Integration

See [TEKTON_PIPELINE_SETUP.md](TEKTON_PIPELINE_SETUP.md) for complete instructions.

Required steps:
1. Create Vault credentials secret
2. Create Caddy proxy ConfigMap
3. Activate the new pipeline

## How It Works

The test uses a **real SSO login flow** to achieve `is_internal: true`:

1. **SSO Login** - Authenticates via Red Hat SSO using E2E_USER/E2E_PASSWORD
2. **Kerberos Auth** - Handles internal SSO page for employee authentication
3. **Token Extraction** - Extracts JWT token from authenticated session
4. **OIDC State Injection** - Sets up react-oidc-context state in sessionStorage
5. **Cookie Setup** - Sets `cs_jwt` cookie with proper domain/path for API access

### Global Setup Flow

The `global-setup.ts` performs these steps once before all tests:

1. Navigate to Red Hat SSO login page
2. Fill username and handle email modal
3. Fill password and submit
4. Handle internal Kerberos SSO page (fills same credentials)
5. Extract `cs_jwt` token from OAuth callback
6. Create new browser context with token preset
7. Inject OIDC state into localStorage and sessionStorage
8. Verify authentication via identity API
9. Save authenticated state to `.auth/internal-user.json` and `.auth/internal-user-session.json`

### Screenshots for Debugging

The global-setup captures screenshots at each step:
- `setup-01-login-page.png` - Initial login page
- `setup-02b-after-modal.png` - After email modal dismissed
- `setup-03-before-submit.png` - Before password submit
- `setup-04-after-submit.png` - After initial submit
- `setup-05-kerberos-filled.png` - Kerberos credentials filled
- `setup-06-after-kerberos-submit.png` - After Kerberos submit
- `setup-07-after-oauth-callback.png` - OAuth callback processed
- `setup-error-final.png` - On any error

Duration: ~30-45 seconds for initial setup, then cached for subsequent runs

## Adaptation Needed

The test may need adaptation for your UI. See [E2E_TESTING_SETUP.md](E2E_TESTING_SETUP.md) for details on:

1. **Navigation Selectors** - Update if your nav structure differs
2. **Form Fields** - Adapt selectors to match your form
3. **Base URL** - Currently `https://console.stage.redhat.com`
4. **Organization ID** - Default `1178977`, configurable via `TAM_INVITE_ORG_ID`

## Test Modes

```bash
bash bin/run_tam_invite_test.sh --headed    # Visible browser (default)
bash bin/run_tam_invite_test.sh --headless  # Background (CI)
bash bin/run_tam_invite_test.sh --debug     # Step-by-step debugging
bash bin/run_tam_invite_test.sh --ui        # Interactive test explorer
```

## Troubleshooting

### Common Issues

**"Vault token expired"**
- Run: `vault login -method=oidc`

**"Button not found"**
- Check navigation selectors match your UI
- Verify override fired (check screenshots in test-results/)

**"Modal not found"**
- Update modal selector if PatternFly version differs

See [E2E_TESTING_SETUP.md](E2E_TESTING_SETUP.md) for complete troubleshooting guide.

## Documentation Structure

```
.
├── E2E_TESTING_README.md (this file)    # Overview and quick start
├── E2E_TESTING_SETUP.md                 # Complete setup and adaptation guide
└── TEKTON_PIPELINE_SETUP.md             # CI/CD pipeline configuration
```

## Next Steps

1. **Install and test locally**
   ```bash
   npm install
   bash bin/run_tam_invite_test.sh
   ```

2. **Adapt selectors** to match your UI (see E2E_TESTING_SETUP.md)

3. **Set up CI/CD** (see TEKTON_PIPELINE_SETUP.md)

4. **Add more tests** as needed

## Resources

- [Original Investigation Repo](https://gitlab.cee.redhat.com/btweed/internal-flag-investigation)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Frontend Starter App Example](https://github.com/RedHatInsights/frontend-starter-app)

---

**Status**: Ready for adaptation
**Source**: 3scale-interaction investigation project
**Last Updated**: 2026-07-01
