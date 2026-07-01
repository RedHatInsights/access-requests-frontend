/**
 * Type declarations for custom window properties used in E2E tests
 */

interface ChromeUser {
  identity: {
    user: {
      is_internal: boolean;
      is_org_admin: boolean;
      username: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

interface InsightsChrome {
  auth: {
    getUser: () => Promise<ChromeUser>;
    [key: string]: any;
  };
  [key: string]: any;
}

declare global {
  interface Window {
    insights?: {
      chrome?: InsightsChrome;
      [key: string]: any;
    };
  }
}

export {};
