# E2E Testing for Access Requests Frontend

Complete E2E testing infrastructure copied from the 3scale-interaction investigation project.

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
├── setup/global-setup.ts            # Vault authentication
├── fixtures/auth-fixture.ts          # Auth fixture
├── types/window.d.ts                # TypeScript definitions
├── vault-client.ts                  # Vault integration (node-vault)
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
- `@redhat-cloud-services/playwright-test-auth: ^0.0.2`
- `@types/node: ^20.10.0`
- `node-vault: ^0.12.0`

## Quick Start

### Local Testing

```bash
# 1. Install dependencies
npm install

# 2. Run the test (auto-authenticates with Vault)
bash bin/run_tam_invite_test.sh
```

The script will:
- Check for Vault CLI
- Authenticate with Vault (opens browser for SSO)
- Run the test with visible browser
- Show green ✓ or red ✗ result

### CI/CD Integration

See [TEKTON_PIPELINE_SETUP.md](TEKTON_PIPELINE_SETUP.md) for complete instructions.

Required steps:
1. Create Vault credentials secret
2. Create Caddy proxy ConfigMap
3. Activate the new pipeline

## How It Works

The test uses a **hybrid authentication approach** to achieve `is_internal: true`:

1. **Real SSO Login** - Creates valid OIDC session
2. **Token Swap** - Replaces token with Vault internal user token
3. **chrome.auth.getUser() Override** - Forces `is_internal: true` before React mounts

### Test Flow (9 Steps)

1. Vault Authentication
2. SSO Login (two-stage)
3. OIDC Token Swap
4. Identity Verification (`is_internal: true`, `is_org_admin: true`)
5. Navigate to TAM invite page
6. Fill Form Step 1 (org ID + dates)
7. Fill Form Step 2 (select roles)
8. Review & Submit
9. Verify in table

Duration: ~45 seconds

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
