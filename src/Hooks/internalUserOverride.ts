// UI-only override for E2E testing; it does not grant server-side permissions.
export const FORCE_INTERNAL_USER_KEY = 'access-requests:force-internal-user';

export const forceInternalUser = () => {
  try {
    return window.localStorage.getItem(FORCE_INTERNAL_USER_KEY) === 'true';
  } catch {
    return false;
  }
};
