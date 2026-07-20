import type { Preview } from '@storybook/react-webpack5';
import '@patternfly/react-core/dist/styles/base.css';
import React from 'react';
import { Provider } from 'react-redux';
import registry, { RegistryContext } from '../src/store';
import { HccStorybookProvider, type FeatureFlagsConfig, FeatureFlagsProvider, hccPreviewDefaults } from '@redhat-cloud-services/hcc-storybook-hub';
import { MemoryRouter } from 'react-router-dom';
import NotificationsProvider from '@redhat-cloud-services/frontend-components-notifications/NotificationsProvider';

const preview: Preview = {
  ...hccPreviewDefaults,
  parameters: {
    ...hccPreviewDefaults.parameters,
    actions: { argTypesRegex: '^on.*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    chrome: {
      environment: 'prod',
    },
    featureFlags: {
      'platform.rbac.itless': false,
    },
  },
  decorators: [
    (Story, { parameters, args }) => {
      const featureFlags: FeatureFlagsConfig = {
        'platform.rbac.itless': false,
        ...parameters.featureFlags,
        ...(args['platform.rbac.itless'] !== undefined && { 'platform.rbac.itless': args['platform.rbac.itless'] }),
      };

      if (typeof window !== 'undefined') {
        (window as any).API_BASE = '/api/rbac/v1';
      }

      return (
        <MemoryRouter>
          <HccStorybookProvider
            bundle="settings"
            app="access-requests"
            isOrgAdmin
            permissions={['rbac:*:*']}
            userIdentity={{
              user: {
                username: 'jdoe',
                email: 'jdoe@redhat.com',
                first_name: 'John',
                last_name: 'Doe',
                is_org_admin: true,
                is_internal: true,
              },
            }}
          >
            <FeatureFlagsProvider value={featureFlags}>
              <RegistryContext.Provider value={{ getRegistry: () => registry }}>
                <Provider store={registry.getStore()}>
                  <NotificationsProvider>
                    <Story />
                  </NotificationsProvider>
                </Provider>
              </RegistryContext.Provider>
            </FeatureFlagsProvider>
          </HccStorybookProvider>
        </MemoryRouter>
      );
    },
  ],
};

export default preview;
