# Running E2E Tests Locally

Quick guide for running E2E tests on your local machine instead of waiting for CI.

## Prerequisites

1. **Red Hat VPN**: Must be connected (tests use squid proxy locally)
2. **Credentials**: Set environment variables
   ```bash
   export E2E_USER=your-redhat-username
   export E2E_PASSWORD=your-password
   ```

## Running Tests

### Run All Tests
```bash
npx playwright test
```

### Run Specific Test File
```bash
# Internal user tests (fast - ~30 seconds)
npx playwright test playwright/e2e/internal-user.spec.ts

# TAM invite test (slower - ~2-3 minutes)
npx playwright test playwright/e2e/tam-invite-hybrid.spec.ts
```

### Run Single Test
```bash
npx playwright test -g "should verify is_internal flag"
```

### Run with UI (Debug Mode)
```bash
# Opens Playwright UI for debugging
npx playwright test --ui

# Or run in headed mode (see the browser)
npx playwright test --headed

# Or debug mode (pauses at breakpoints)
npx playwright test --debug
```

### Watch Mode (Re-run on Changes)
```bash
npx playwright test --ui
# Then click "Watch all" in the UI
```

## Troubleshooting

### "cs_jwt token not found"
- The global-setup failed to authenticate
- Check that E2E_USER and E2E_PASSWORD are set correctly
- Run with `--headed` to see what's happening during login

### "ERR_PROXY_CONNECTION_FAILED"  
- Not on Red Hat VPN
- Connect to VPN and try again

### "Password field not found"
- SSO page structure may have changed
- Run with `--headed` to see the page
- Check `playwright/test-results/setup-*.png` screenshots

### View Screenshots on Failure
```bash
# Screenshots are saved to:
ls playwright/test-results/

# For global-setup failures:
ls playwright/test-results/setup-*.png
```

### View Test Report
```bash
npx playwright show-report
```

## Fast Feedback Loop

For fastest iteration when fixing tests:

```bash
# 1. Run just the test you're fixing
npx playwright test playwright/e2e/internal-user.spec.ts -g "should verify is_internal"

# 2. Use headed mode to see what's happening
npx playwright test --headed -g "your test name"

# 3. Use debug mode to pause and inspect
npx playwright test --debug -g "your test name"
```

## CI vs Local Differences

| Aspect | Local | CI (Konflux) |
|--------|-------|--------------|
| Proxy | squid.corp.redhat.com:3128 | None (uses stage.foo.redhat.com) |
| VPN | Required | Not needed |
| BASE_URL | console.stage.redhat.com | stage.foo.redhat.com:1337 |
| Speed | Fast (parallel workers) | Slower (1 worker) |
| Credentials | Set manually | From ExternalSecret |

## Common Workflows

### After Changing Global Setup
```bash
# Delete old auth state to force re-authentication
rm -rf playwright/.auth/
npx playwright test
```

### Testing Just Authentication
```bash
# Run just one simple test to verify auth works
npx playwright test -g "should verify is_internal flag"
```

### Debugging TAM Invite Test
```bash
# Run in headed mode to see the full workflow
npx playwright test playwright/e2e/tam-invite-hybrid.spec.ts --headed

# Or use UI mode for step-by-step debugging
npx playwright test playwright/e2e/tam-invite-hybrid.spec.ts --ui
```

## Tips

- **Headed mode** (`--headed`): See the browser - great for debugging
- **UI mode** (`--ui`): Interactive debugging with time-travel
- **Debug mode** (`--debug`): Pause execution and step through
- **Grep** (`-g "pattern"`): Run tests matching pattern
- **Screenshot dir**: `playwright/test-results/` has failure screenshots
- **Trace viewer**: `npx playwright show-trace <trace.zip>` for detailed debugging

## Playwright Inspector

When using `--debug`, you get the Playwright Inspector:
- Step through test line by line
- Inspect page state at each step
- Run custom locators in the console
- Take screenshots at any point

```bash
npx playwright test --debug -g "your test"
```

Happy testing! 🎭
