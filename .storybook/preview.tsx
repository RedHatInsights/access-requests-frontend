import type { Preview } from '@storybook/react-webpack5';
import '@patternfly/react-core/dist/styles/base.css';
import '@patternfly/patternfly/patternfly-addons.css';
import React from 'react';
import { Provider } from 'react-redux';
import registry, { RegistryContext } from '../src/store';
import { type ChromeConfig, ChromeProvider, type FeatureFlagsConfig, FeatureFlagsProvider } from './providers';
// Import MSW
import { initialize, mswLoader } from 'msw-storybook-addon';
import { MemoryRouter } from 'react-router-dom';
import NotificationsProvider from '@redhat-cloud-services/frontend-components-notifications/NotificationsProvider';

// Initialize MSW
initialize();

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    // Default configurations for all stories (can be overridden per story)
    permissions: {
      userAccessAdministrator: false,
      orgAdmin: false
    },
    chrome: {
      environment: 'prod'
    },
    featureFlags: {
      'platform.rbac.itless': false
    },
    mockingDate: new Date(2024, 3, 12)
  },
  decorators: [
    // 👇 Combined context decorator - reads from story parameters and args
    (Story, { parameters, args }) => {
      const chromeConfig: ChromeConfig = {
        environment: 'prod',
        ...parameters.chrome,
        // Override with args if provided (for interactive controls)
        ...(args.environment !== undefined && { environment: args.environment })
      };

      const featureFlags: FeatureFlagsConfig = {
        'platform.rbac.itless': false,
        ...parameters.featureFlags,
        // Override with args if provided (for interactive controls)
        ...(args['platform.rbac.itless'] !== undefined && { 'platform.rbac.itless': args['platform.rbac.itless'] })
      };

      // Mock global API_BASE for Storybook environment
      if (typeof window !== 'undefined') {
        (window as any).API_BASE = '/api/rbac/v1';
      }

      return (
        <MemoryRouter>
          <ChromeProvider value={chromeConfig}>
            <FeatureFlagsProvider value={featureFlags}>
              <RegistryContext.Provider value={{ getRegistry: () => registry }}>
                <Provider store={registry.getStore()}>
                  <NotificationsProvider>
                    <Story />
                  </NotificationsProvider>
                </Provider>
              </RegistryContext.Provider>
            </FeatureFlagsProvider>
          </ChromeProvider>
        </MemoryRouter>
      );
    }
  ],
  loaders: [mswLoader]
};

export default preview;
