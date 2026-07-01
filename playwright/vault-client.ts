import vault from 'node-vault';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

/**
 * Vault client for retrieving secrets and tokens.
 *
 * Uses the Vault CLI token from environment or ~/.vault-token for authentication.
 */

const VAULT_ADDR = process.env.VAULT_ADDR || 'https://vault.devshift.net';
// Note: Vault KV v2 requires /data/ in the API path (vault CLI adds this automatically)
const VAULT_PATH = 'insights/data/secrets/qe/stage/users/idp_internal_user';

/**
 * Gets the Vault token from environment or ~/.vault-token file.
 *
 * Matches the behavior of the Vault CLI:
 * 1. Check VAULT_TOKEN environment variable
 * 2. Check ~/.vault-token file
 *
 * @returns The Vault token
 * @throws Error if no token is found
 */
function getVaultToken(): string {
  if (process.env.VAULT_TOKEN) {
    return process.env.VAULT_TOKEN;
  }

  const tokenPath = join(homedir(), '.vault-token');
  try {
    return readFileSync(tokenPath, 'utf-8').trim();
  } catch (error) {
    throw new Error(
      'No Vault token found. Run "vault login -method=oidc" or set VAULT_TOKEN environment variable.'
    );
  }
}

/**
 * Creates an authenticated Vault client.
 *
 * Authentication is handled by reading the token from:
 * 1. VAULT_TOKEN environment variable, or
 * 2. ~/.vault-token file
 *
 * This matches the behavior of the Vault CLI.
 */
function createVaultClient() {
  const token = getVaultToken();
  return vault({
    apiVersion: 'v1',
    endpoint: VAULT_ADDR,
    token,
  });
}

/**
 * Retrieves a specific field from the internal user secret in Vault.
 *
 * @param fieldPath - Field name to retrieve (e.g., 'idp_username', 'idp_password')
 * @returns The field value as a string
 * @throws Error if the secret cannot be retrieved or field doesn't exist
 */
export async function getVaultSecret(fieldPath: string): Promise<string> {
  const client = createVaultClient();

  try {
    const result = await client.read(VAULT_PATH);
    const value = result.data.data[fieldPath];

    if (!value) {
      throw new Error(`Field '${fieldPath}' not found in ${VAULT_PATH}`);
    }

    return value;
  } catch (error: any) {
    throw new Error(`Failed to get ${fieldPath} from Vault: ${error.message}`);
  }
}

/**
 * Retrieves the internal user credentials from Vault.
 *
 * @returns Object containing username and password
 */
export async function getInternalUserCredentials(): Promise<{ username: string; password: string }> {
  const [username, password] = await Promise.all([
    getVaultSecret('idp_username'),
    getVaultSecret('idp_password'),
  ]);

  return { username, password };
}

/**
 * Exchanges a refresh token for an access token via SSO.
 *
 * @param refreshToken - OAuth refresh token
 * @returns JWT access token
 */
async function exchangeRefreshToken(refreshToken: string): Promise<string> {
  const tokenEndpoint =
    'https://sso.stage.redhat.com/auth/realms/redhat-external/protocol/openid-connect/token';

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: 'cloud-services',
    refresh_token: refreshToken,
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Retrieves the internal user access token.
 *
 * Gets the refresh token (ocm_token) from Vault and exchanges it for an access token
 * issued by the cloud-services OAuth client with the idp: auth.stage.redhat.com claim.
 *
 * @returns JWT access token with is_internal: true
 * @throws Error if token is invalid or cannot be retrieved
 */
export async function getInternalUserToken(): Promise<string> {
  // Get refresh token from Vault
  const refreshToken = await getVaultSecret('ocm_token');

  // Exchange for access token
  const accessToken = await exchangeRefreshToken(refreshToken);

  // Validate it's a JWT (3 parts separated by dots)
  if (!accessToken || accessToken.split('.').length !== 3) {
    throw new Error('Retrieved token is not a valid JWT format');
  }

  return accessToken;
}
