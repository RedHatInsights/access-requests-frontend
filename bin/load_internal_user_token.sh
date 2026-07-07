#!/usr/bin/env bash

# Script to obtain is_internal: true using Vault-stored credentials
# Based on information from Vinicius (2026-06-24)

set -e

printf "========================================\n"
printf "Internal User Token Test\n"
printf "========================================\n\n"

# Step 1: Connect to Vault
printf "Step 1: Connecting to Vault...\n"
export VAULT_ADDR="https://vault.devshift.net"

if ! command -v vault &>/dev/null; then
    printf "Error: vault CLI not found. Please install it first.\n"
    printf "See: https://www.vaultproject.io/downloads\n"
    exit 1
fi

printf "Vault address: %s\n" "${VAULT_ADDR}"
printf "Logging in via OIDC (this may open a browser)...\n\n"

vault login -method=oidc -no-print

printf "✓ Vault login successful\n\n"

# Step 2: Get refresh token from Vault
printf "Step 2: Retrieving refresh token from Vault...\n"
printf "Path: insights/secrets/qe/stage/users/idp_internal_user\n\n"

REFRESH_TOKEN=$(vault kv get -field=ocm_token insights/secrets/qe/stage/users/idp_internal_user)

if [ -z "${REFRESH_TOKEN}" ]; then
    printf "Error: Failed to retrieve refresh token from Vault\n"
    exit 1
fi

printf "✓ Refresh token retrieved (length: %d chars)\n\n" "${#REFRESH_TOKEN}"

# Step 3: Decode refresh token to inspect it
printf "Step 3: Decoding refresh token...\n"

PAYLOAD=$(echo -n "${REFRESH_TOKEN}" | cut -d '.' -f 2)
PAYLOAD_BASE64=$(echo -n "${PAYLOAD}" | tr -- '-_' '+/')
PADDING=$((4 - ${#PAYLOAD_BASE64} % 4))
if [ ${PADDING} -ne 4 ]; then
    PAYLOAD_BASE64="${PAYLOAD_BASE64}$(printf '=%.0s' $(seq 1 ${PADDING}))"
fi
DECODED=$(echo -n "${PAYLOAD_BASE64}" | base64 -d 2>/dev/null)

printf "Refresh token payload:\n%s\n\n" "${DECODED}" | jq . 2>/dev/null || printf "%s\n\n" "${DECODED}"

# Extract key claims
if command -v jq &>/dev/null; then
    SUBJECT=$(echo "${DECODED}" | jq -r '.sub // "not found"')
    CLIENT=$(echo "${DECODED}" | jq -r '.azp // "not found"')
    printf "Subject: %s\n" "${SUBJECT}"
    printf "Client: %s\n\n" "${CLIENT}"
fi

# Step 4: Exchange refresh token for access token
printf "Step 4: Exchanging refresh token for access token...\n"

export HOST='https://sso.stage.redhat.com'
export SCOPES='openid api.iam.service_accounts offline_access'
export CLIENT_ID='cloud-services'

printf "SSO Host: %s\n" "${HOST}"
printf "Client ID: %s\n" "${CLIENT_ID}"
printf "Scopes: %s\n\n" "${SCOPES}"

TOKEN_ENDPOINT="${HOST}/auth/realms/redhat-external/protocol/openid-connect/token"

TOKEN_RESPONSE=$(curl -s "${TOKEN_ENDPOINT}" \
    --data-urlencode "grant_type=refresh_token" \
    --data-urlencode "client_id=${CLIENT_ID}" \
    --data-urlencode "refresh_token=${REFRESH_TOKEN}" \
    --data-urlencode "scope=${SCOPES}")

if ! echo "${TOKEN_RESPONSE}" | jq -e '.access_token' &>/dev/null; then
    printf "Error: Failed to obtain access token\n"
    printf "Response: %s\n" "${TOKEN_RESPONSE}" | jq . 2>/dev/null || printf "%s\n" "${TOKEN_RESPONSE}"
    exit 1
fi

export ACCESS_TOKEN=$(echo "${TOKEN_RESPONSE}" | jq -r '.access_token')

printf "✓ Access token obtained (length: %d chars)\n\n" "${#ACCESS_TOKEN}"

# Step 5: Decode access token to inspect it
printf "Step 5: Decoding access token...\n"

ACCESS_PAYLOAD=$(echo -n "${ACCESS_TOKEN}" | cut -d '.' -f 2)
ACCESS_PAYLOAD_BASE64=$(echo -n "${ACCESS_PAYLOAD}" | tr -- '-_' '+/')
ACCESS_PADDING=$((4 - ${#ACCESS_PAYLOAD_BASE64} % 4))
if [ ${ACCESS_PADDING} -ne 4 ]; then
    ACCESS_PAYLOAD_BASE64="${ACCESS_PAYLOAD_BASE64}$(printf '=%.0s' $(seq 1 ${ACCESS_PADDING}))"
fi
ACCESS_DECODED=$(echo -n "${ACCESS_PAYLOAD_BASE64}" | base64 -d 2>/dev/null)

printf "Access token payload:\n%s\n\n" "${ACCESS_DECODED}" | jq . 2>/dev/null || printf "%s\n\n" "${ACCESS_DECODED}"

# Check for idp claim
if command -v jq &>/dev/null; then
    IDP_CLAIM=$(echo "${ACCESS_DECODED}" | jq -r 'if .idp == null then "not found" else .idp end')
    printf "idp claim in access token: %s\n" "${IDP_CLAIM}"

    ACCESS_SUBJECT=$(echo "${ACCESS_DECODED}" | jq -r '.sub // "not found"')
    ACCESS_CLIENT=$(echo "${ACCESS_DECODED}" | jq -r '.azp // "not found"')
    ACCESS_AUDIENCE=$(echo "${ACCESS_DECODED}" | jq -r '.aud // "not found"')
    printf "Subject: %s\n" "${ACCESS_SUBJECT}"
    printf "Client: %s\n" "${ACCESS_CLIENT}"
    printf "Audience: %s\n\n" "${ACCESS_AUDIENCE}"
fi

# Step 6: Call identity endpoint
printf "Step 6: Calling 3scale identity endpoint...\n"

GATEWAY_URL="https://console.stage.redhat.com/api/apicast-tests/identity"
PROXY_URL="http://squid.corp.redhat.com:3128"

printf "Gateway URL: %s\n" "${GATEWAY_URL}"
printf "Proxy: %s\n\n" "${PROXY_URL}"

IDENTITY_RESPONSE=$(curl -s \
    --proxy "${PROXY_URL}" \
    -H 'accept: application/json' \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    "${GATEWAY_URL}")

printf "Identity Response:\n%s\n\n" "${IDENTITY_RESPONSE}" | jq . 2>/dev/null || printf "%s\n\n" "${IDENTITY_RESPONSE}"

# Step 7: Extract and display is_internal flag
printf "========================================\n"
printf "RESULT\n"
printf "========================================\n\n"

if command -v jq &>/dev/null; then
    IS_INTERNAL=$(echo "${IDENTITY_RESPONSE}" | jq -r 'if .identity.user.is_internal == null then "not found" else .identity.user.is_internal end')
    USERNAME=$(echo "${IDENTITY_RESPONSE}" | jq -r '.identity.user.username // "not found"')
    ORG_ID=$(echo "${IDENTITY_RESPONSE}" | jq -r '.identity.org_id // "not found"')
    INTERNAL_ENTITLED=$(echo "${IDENTITY_RESPONSE}" | jq -r '.entitlements.internal.is_entitled // "not found"')

    printf "Username: %s\n" "${USERNAME}"
    printf "Organization ID: %s\n" "${ORG_ID}"
    printf "\n"
    printf "is_internal (user property): %s\n" "${IS_INTERNAL}"
    printf "internal entitlement: %s\n" "${INTERNAL_ENTITLED}"
    printf "\n"

    if [ "${IS_INTERNAL}" = "true" ]; then
        printf "✓ SUCCESS: is_internal is TRUE!\n"
    else
        printf "✗ FAILED: is_internal is still %s\n" "${IS_INTERNAL}"
    fi
else
    printf "Warning: jq not found, cannot parse response\n"
    printf "is_internal: %s\n" "$(echo "${IDENTITY_RESPONSE}" | grep -o '"is_internal":[^,}]*' | head -1)"
fi

printf "\n"
