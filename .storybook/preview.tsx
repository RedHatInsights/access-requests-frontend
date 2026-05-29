import type { Preview } from '@storybook/react-webpack5';
import '@patternfly/react-core/dist/styles/base.css';
import '@patternfly/patternfly/patternfly-addons.css';
import React from 'react';
import { Provider } from 'react-redux';
import registry, { RegistryContext } from '../src/store';
import { FeatureFlagsProvider, StorybookMockProvider } from '@redhat-cloud-services/hcc-storybook-hub';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { MemoryRouter } from 'react-router-dom';
import NotificationsProvider from '@redhat-cloud-services/frontend-components-notifications/NotificationsProvider';

initialize();

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on.*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
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
    (Story, { parameters, args }) => {
      const environment = args.environment ?? parameters.chrome?.environment ?? 'prod';

      const featureFlags: Record<string, boolean> = {
        'platform.rbac.itless': false,
        ...parameters.featureFlags,
        ...(args['platform.rbac.itless'] !== undefined && { 'platform.rbac.itless': args['platform.rbac.itless'] })
      };

      if (typeof window !== 'undefined') {
        (window as any).API_BASE = '/api/rbac/v1';
      }

      return (
        <StorybookMockProvider
          environment={environment === 'prod' ? 'production' : 'staging'}
          isOrgAdmin={args.orgAdmin ?? parameters.permissions?.orgAdmin ?? false}
          permissions={['rbac:*:*']}
        >
          <FeatureFlagsProvider value={featureFlags}>
            <MemoryRouter>
              <RegistryContext.Provider value={{ getRegistry: () => registry }}>
                <Provider store={registry.getStore()}>
                  <NotificationsProvider>
                    <Story />
                  </NotificationsProvider>
                </Provider>
              </RegistryContext.Provider>
            </MemoryRouter>
          </FeatureFlagsProvider>
        </StorybookMockProvider>
      );
    }
  ],
  loaders: [mswLoader]
};

export default preview;
