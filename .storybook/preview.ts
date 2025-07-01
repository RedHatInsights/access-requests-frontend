import type { Preview } from '@storybook/react-webpack5'
import React from 'react'
import { Provider } from 'react-redux'
import registry, { RegistryContext } from '../src/store'

// Import PatternFly CSS
import '@patternfly/react-core/dist/styles/base.css'
// Import PatternFly spacing utilities for margin/padding classes
import '@patternfly/react-styles/css/utilities/Spacing/spacing.css'

// Define types for better type safety
interface MockUser {
  is_internal: boolean;
  is_org_admin: boolean;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface MockChrome {
  auth: {
    getUser: () => Promise<{ identity: { user: MockUser } }>;
    getUserPermissions: () => Promise<any[]>;
  };
  updateDocumentTitle: (title: string) => void;
  getBundleData: () => string;
  isBeta: () => boolean;
  appNavClick: () => Promise<void>;
  appAction: () => void;
  appObjectId: () => void;
}

// Mock Chrome API for stories
function createMockChrome(overrides: any = {}): MockChrome {
  const defaultUser: MockUser = {
    is_internal: true,
    is_org_admin: false,
    username: 'storybook-user',
    email: 'storybook@redhat.com',
    first_name: 'Storybook',
    last_name: 'User',
    ...overrides.user
  };

  return {
    auth: {
      getUser: () => Promise.resolve({
        identity: {
          user: defaultUser
        }
      }),
      getUserPermissions: () => Promise.resolve([]),
      ...overrides.auth
    },
    updateDocumentTitle: (title: string) => { document.title = title; },
    getBundleData: () => overrides.bundle || 'insights',
    isBeta: () => overrides.isBeta || false,
    appNavClick: () => Promise.resolve(),
    appAction: () => {},
    appObjectId: () => {},
    ...overrides
  }
}

// Mock global insights object
function mockInsights(chromeOverrides: any = {}): MockChrome {
  const mockChromeInstance: MockChrome = createMockChrome(chromeOverrides);
  (global as any).insights = { chrome: mockChromeInstance };
  return mockChromeInstance;
}

// Chrome Context Decorator
export function withMockChrome(chromeConfig: any = {}) {
  return function(Story: any) {
    React.useEffect(() => {
      mockInsights(chromeConfig)
      return () => {
        // Cleanup if needed
      }
    }, [])
    
    return React.createElement(Story)
  }
}

// Redux Store Decorator  
export function withReduxStore(Story: any) {
  return React.createElement(
    RegistryContext.Provider,
    {
      value: {
        getRegistry: () => registry,
      },
    },
    React.createElement(
      Provider,
      { store: registry.getStore() },
      React.createElement(Story)
    )
  )
}

// Feature Flag Decorator
export function withFeatureFlags(flags: { isBeta?: boolean; bundle?: string } = {}) {
  return function(Story: any) {
    return withMockChrome({
      isBeta: flags.isBeta || false,
      bundle: flags.bundle || 'insights'
    })(Story)
  }
}

// Permission Context Decorator
export function withPermissions(permissions: {
  isInternal?: boolean;
  isOrgAdmin?: boolean;
  username?: string;
} = {}) {
  return function(Story: any) {
    return withMockChrome({
      user: {
        is_internal: permissions.isInternal ?? true,
        is_org_admin: permissions.isOrgAdmin ?? false,
        username: permissions.username || 'storybook-user'
      }
    })(Story)
  }
}

const preview: Preview = {
  parameters: {
    docs: {
      autodocs: 'tag',
    },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
  decorators: [
    // Apply Chrome mock by default
    withMockChrome(),
    // Apply Redux store by default
    withReduxStore,
  ],
};

export default preview;