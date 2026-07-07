# Tekton Pipeline Setup for E2E Tests

This document explains how to set up the Tekton/Konflux pipeline to run E2E tests on pull requests.

## New Pipeline File

Created: `.tekton/access-requests-frontend-pull-request-with-e2e.yaml`

This pipeline extends the existing pull-request pipeline to include E2E tests using Playwright.

## Key Differences from Existing Pipeline

### 1. Pipeline Reference
**Old** (current): Uses `docker-build-run-unit-tests.yaml`
```yaml
pipelinesascode.tekton.dev/pipeline: https://github.com/RedHatInsights/konflux-pipelines/raw/main/pipelines/platform-ui/docker-build-run-unit-tests.yaml
```

**New**: Uses `docker-build-run-all-tests.yaml` (includes E2E)
```yaml
pipelineRef:
  resolver: git
  params:
  - name: url
    value: https://github.com/catastrophe-brandon/konflux-pipelines
  - name: revision
    value: btweed/v2-default-playwright-image
  - name: pathInRepo
    value: pipelines/platform-ui/docker-build-run-all-tests.yaml
```

### 2. Additional Parameters

**Playwright Image**:
```yaml
- name: e2e-playwright-image
  value: mcr.microsoft.com/playwright:v1.40.0-noble
```

**Application Port**:
```yaml
- name: e2e-app-port
  value: "8000"
```

**Workspace Setup** (installs Playwright browsers):
```yaml
- name: workspace-setup-script
  value: |
    #!/bin/bash
    set -ex

    npm install
    npx playwright install chromium
```

**E2E Test Script**:
```yaml
- name: e2e-tests-script
  value: |
    #!/bin/bash
    set -ex

    # Wait for application
    timeout 120s bash -c 'until curl -k https://stage.foo.redhat.com:1337 > /dev/null 2>&1; do
      sleep 5
    done'

    # Set Vault address
    export VAULT_ADDR=https://vault.devshift.net

    # Check Vault token
    if [ -z "$VAULT_TOKEN" ]; then
      echo "WARNING: VAULT_TOKEN not set - E2E tests will be skipped"
      exit 0
    fi

    # Run tests
    npx playwright test
```

### 3. Secrets and ConfigMaps

**Credentials Secret** (needs to be created):
```yaml
- name: e2e-credentials-secret
  value: access-requests-frontend-credentials-secret
```

**Proxy Routes ConfigMap** (needs to be created):
```yaml
- name: frontend-proxy-routes-configmap
  value: access-requests-frontend-dev-proxy-caddyfile-v2
```

### 4. Host Aliases

For local testing, the pipeline overrides `/etc/hosts`:
```yaml
taskRunSpecs:
  - pipelineTaskName: run-e2e-tests
    podTemplate:
      hostAliases:
        - ip: "::1"
          hostnames:
            - "stage.foo.redhat.com"
        - ip: "127.0.0.1"
          hostnames:
            - "stage.foo.redhat.com"
```

### 5. Increased Storage

E2E tests need more storage:
```yaml
workspaces:
  - name: workspace
    volumeClaimTemplate:
      spec:
        resources:
          requests:
            storage: 3Gi  # Increased from 1Gi
```

## Required Setup Steps

### Step 1: Create Credentials Secret

The E2E tests need a Vault token to access internal user credentials. Create a secret in your namespace:

```bash
# Get your Vault token
vault login -method=oidc

# Read the token
VAULT_TOKEN=$(cat ~/.vault-token)

# Create the secret in Konflux/OpenShift
oc create secret generic access-requests-frontend-credentials-secret \
  --from-literal=VAULT_TOKEN="$VAULT_TOKEN" \
  -n rh-platform-experien-tenant
```

**Note**: Vault tokens expire after 30 minutes. For CI/CD, you'll need to:
1. Use a service account token, OR
2. Set up token renewal, OR
3. Skip E2E tests when token is unavailable (current approach)

### Step 2: Create Proxy Routes ConfigMap

Create a Caddyfile ConfigMap for routing requests:

```bash
kubectl create configmap access-requests-frontend-dev-proxy-caddyfile-v2 \
  -n rh-platform-experien-tenant \
  --from-file=Caddyfile=/path/to/your/Caddyfile
```

**Example Caddyfile** (adapt from frontend-starter-app):
```caddyfile
{
    admin off
    auto_https off
}

:1337 {
    # Reverse proxy to local dev server
    reverse_proxy localhost:8000

    # Add necessary headers
    header {
        Access-Control-Allow-Origin *
        Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Access-Control-Allow-Headers *
    }

    # Handle OPTIONS requests
    @options {
        method OPTIONS
    }
    respond @options 204

    tls internal
}
```

### Step 3: Update Pipeline Reference

Once the credentials and ConfigMap are created, you can either:

**Option A: Replace existing pipeline**
```bash
cd /Users/btweed/repos/js/access-requests-frontend
mv .tekton/access-requests-frontend-pull-request.yaml .tekton/access-requests-frontend-pull-request.yaml.backup
mv .tekton/access-requests-frontend-pull-request-with-e2e.yaml .tekton/access-requests-frontend-pull-request.yaml
git add .tekton/
git commit -m "feat: add E2E tests to pull request pipeline"
```

**Option B: Keep both and test separately**
- Keep the new file with a different name
- Trigger it manually to test first
- Once validated, replace the main pipeline

## Testing the Pipeline

### Option 1: Test Locally with Act

If you want to test the pipeline changes locally before committing:

```bash
# Install act (if not already installed)
brew install act

# Run the pipeline locally (requires Docker)
act pull_request
```

### Option 2: Test in a PR

1. Create a branch with the new pipeline
2. Open a pull request
3. The pipeline will run automatically
4. Check the Konflux/Tekton dashboard for results

## Troubleshooting

### E2E Tests Skipped

If you see "E2E tests will be skipped", check:
1. Is the `VAULT_TOKEN` in the credentials secret?
2. Has the Vault token expired?
3. Does the service account have access to the secret?

### Application Not Ready

If tests timeout waiting for the app:
1. Check the application logs in Tekton
2. Verify the port (8000) matches your app
3. Check the Caddyfile routing configuration

### Vault Access Denied

If Vault authentication fails:
1. Verify the token is valid: `vault token lookup`
2. Check permissions: `vault kv get insights/secrets/qe/stage/users/idp_internal_user`
3. Ensure the token hasn't expired (30 min default)

### Playwright Browser Issues

If browser installation fails:
1. Check the Playwright image version matches package.json
2. Verify sufficient disk space (3Gi workspace)
3. Check network access for downloading browsers

## Alternative: Skip E2E in CI Initially

If you want to get the pipeline working without E2E tests first:

1. Use the existing `access-requests-frontend-pull-request.yaml` (unit tests only)
2. Run E2E tests manually or in a separate nightly pipeline
3. Add E2E to PR pipeline once infrastructure is validated

## Pipeline Execution Flow

When a PR is opened:

1. **Build** - Docker image is built
2. **Unit Tests** - `npm run lint` and `npm test`
3. **Start Application** - App runs with Caddy proxy
4. **E2E Tests** - Playwright tests execute
   - Wait for app to be ready
   - Check Vault authentication
   - Run `npx playwright test`
   - Generate test report

## Next Steps

1. **Create secrets and ConfigMaps** (Steps 1-2 above)
2. **Test the pipeline** with a PR
3. **Monitor and iterate** based on results
4. **Add more E2E tests** as needed
5. **Set up test result reporting** (Playwright HTML reports)

## Resources

- [Konflux Pipelines Repo](https://github.com/catastrophe-brandon/konflux-pipelines)
- [Frontend Starter App Example](https://github.com/RedHatInsights/frontend-starter-app/.tekton/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Tekton Pipelines Documentation](https://tekton.dev/docs/pipelines/)

---

**Status**: Ready for testing
**Created**: 2026-07-01
