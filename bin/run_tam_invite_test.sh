#!/usr/bin/env bash
#
# Run TAM Invite E2E Test
#
# This script:
# 1. Checks for Vault authentication
# 2. Verifies access to the required Vault secret
# 3. Runs the Playwright test
#
# Prerequisites:
# - Red Hat VPN connection
# - Vault CLI installed (brew install vault)
#
# Usage:
#   bash bin/run_tam_invite_test.sh             # Run in headed mode (default - visible browser)
#   bash bin/run_tam_invite_test.sh --headed    # Explicitly run in headed mode
#   bash bin/run_tam_invite_test.sh --headless  # Run headless (CI mode)
#   bash bin/run_tam_invite_test.sh --debug     # Run in debug mode
#   bash bin/run_tam_invite_test.sh --ui        # Run in UI mode
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vault configuration
export VAULT_ADDR='https://vault.devshift.net'
VAULT_SECRET_PATH='insights/secrets/qe/stage/users/idp_internal_user'

printf "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}\n"
printf "${BLUE}║        TAM Invite E2E Test Runner                       ║${NC}\n"
printf "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}\n\n"

# Check if vault CLI is installed
if ! command -v vault &> /dev/null; then
    printf "${RED}✗ Vault CLI not found${NC}\n"
    printf "  Install with: ${YELLOW}brew install vault${NC}\n\n"
    exit 1
fi

printf "${GREEN}✓${NC} Vault CLI installed\n"

# Function to authenticate with Vault
vault_login() {
    printf "\n${YELLOW}Authenticating with Vault...${NC}\n"
    printf "This will open your browser for SSO authentication.\n\n"

    if vault login -method=oidc; then
        printf "\n${GREEN}✓${NC} Vault authentication successful\n"
        return 0
    else
        printf "\n${RED}✗ Vault authentication failed${NC}\n"
        return 1
    fi
}

# Check if vault token exists
if [ ! -f "$HOME/.vault-token" ]; then
    printf "${YELLOW}! No Vault token found${NC}\n"
    printf "  Starting Vault authentication...\n"

    if ! vault_login; then
        exit 1
    fi
else
    printf "${GREEN}✓${NC} Vault token file exists\n"

    # Verify vault token is valid by trying to access the secret
    printf "Checking Vault access...\n"
    if ! vault kv get "${VAULT_SECRET_PATH}" &> /dev/null; then
        printf "${YELLOW}! Vault token expired or insufficient permissions${NC}\n"
        printf "  Re-authenticating...\n"

        if ! vault_login; then
            exit 1
        fi
    fi
fi

printf "${GREEN}✓${NC} Vault access verified\n"
printf "${GREEN}✓${NC} Can access: ${VAULT_SECRET_PATH}\n\n"

# Determine test mode from argument
TEST_MODE="--headed"
if [ "$1" == "--headless" ]; then
    TEST_MODE=""
    printf "Running in ${YELLOW}headless${NC} mode (background - no browser window)\n"
elif [ "$1" == "--headed" ]; then
    TEST_MODE="--headed"
    printf "Running in ${YELLOW}headed${NC} mode (visible browser window)\n"
elif [ "$1" == "--debug" ]; then
    TEST_MODE="--debug"
    printf "Running in ${YELLOW}debug${NC} mode (step-by-step debugging)\n"
elif [ "$1" == "--ui" ]; then
    TEST_MODE="--ui"
    printf "Running in ${YELLOW}UI${NC} mode (interactive test explorer)\n"
else
    printf "Running in ${YELLOW}headed${NC} mode (visible browser - default)\n"
fi

printf "\n${BLUE}Starting Playwright test...${NC}\n\n"

# Run the test
if [ -n "$TEST_MODE" ]; then
    npx playwright test tam-invite-hybrid.spec.ts $TEST_MODE
else
    npx playwright test tam-invite-hybrid.spec.ts
fi

# Capture exit code
TEST_EXIT_CODE=$?

printf "\n"
if [ $TEST_EXIT_CODE -eq 0 ]; then
    printf "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}\n"
    printf "${GREEN}║                  ✓ TEST PASSED ✓                        ║${NC}\n"
    printf "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}\n"
else
    printf "${RED}╔══════════════════════════════════════════════════════════╗${NC}\n"
    printf "${RED}║                  ✗ TEST FAILED ✗                        ║${NC}\n"
    printf "${RED}╚══════════════════════════════════════════════════════════╝${NC}\n"
    printf "\nView the report: ${YELLOW}npm run test:report${NC}\n"
fi

printf "\n"
exit $TEST_EXIT_CODE
