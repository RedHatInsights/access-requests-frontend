import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor } from 'storybook/test';
import { http, HttpResponse } from 'msw';
import AccessRequestsPage from '../../Routes/AccessRequestsPage';

const mockAccessRequestsData = {
  meta: { count: 1, limit: 20, offset: 0 },
  data: [
    {
      request_id: 'abc-123',
      target_org: '7654321',
      status: 'pending',
      start_date: '2024-01-15T10:00:00Z',
      end_date: '2024-02-15T10:00:00Z',
      created: '2024-01-10T08:30:00Z',
      user_id: 'user123',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      roles: [],
    },
  ],
};

const mockUserData = {
  identity: {
    user: {
      first_name: 'John',
      last_name: 'Doe',
      username: 'johndoe@example.com',
      is_internal: true,
      is_org_admin: true,
      email: 'johndoe@example.com',
      user_id: '12345',
      account_number: '1234567',
      org_id: '7654321',
    },
    account: { account_number: '1234567', org_id: '7654321' },
    internal: { org_id: '7654321' },
  },
  entitlements: {},
  token: 'mock-jwt-token',
};

const meta: Meta<typeof AccessRequestsPage> = {
  component: AccessRequestsPage,
  title: 'Hooks/useAccessRequestsData',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof AccessRequestsPage>;

/**
 * Verifies that internal users always get query_by=user_id,
 * even when they are org admins (RHCLOUD-47400 fix).
 */
export const InternalUserUsesQueryByUserId: Story = {
  args: { isInternal: true },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/cross-account-requests/', ({ request }) => {
          const url = new URL(request.url);
          const queryBy = url.searchParams.get('query_by');
          // Tag the response so play function can verify
          return HttpResponse.json({
            ...mockAccessRequestsData,
            meta: {
              ...mockAccessRequestsData.meta,
              _test_query_by: queryBy,
            },
          });
        }),
        http.get('/api/chrome-service/v1/user/', () =>
          HttpResponse.json(mockUserData)
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Wait for data to load — the request_id link should appear
    await waitFor(
      () => {
        expect(canvas.getByText('abc-123')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  },
};

/**
 * Verifies that internal org admin users also get query_by=user_id.
 * Before the RHCLOUD-47400 fix, IAM org admins incorrectly got query_by=target_org.
 */
export const InternalOrgAdminUsesQueryByUserId: Story = {
  args: { isInternal: true },
  parameters: {
    chrome: {
      bundleId: 'iam',
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/cross-account-requests/', ({ request }) => {
          const url = new URL(request.url);
          const queryBy = url.searchParams.get('query_by');
          if (queryBy !== 'user_id') {
            return HttpResponse.json(
              {
                errors: [
                  {
                    detail: `Expected query_by=user_id but got query_by=${queryBy}`,
                  },
                ],
              },
              { status: 400 }
            );
          }
          return HttpResponse.json(mockAccessRequestsData);
        }),
        http.get('/api/chrome-service/v1/user/', () =>
          HttpResponse.json({
            ...mockUserData,
            identity: {
              ...mockUserData.identity,
              user: { ...mockUserData.identity.user, is_org_admin: true },
            },
          })
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () => {
        expect(canvas.getByText('abc-123')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
    // If query_by was wrong, the handler returns a 400 and we'd see an error notification
    expect(
      canvas.queryByText(/Expected query_by=user_id/)
    ).not.toBeInTheDocument();
  },
};

/**
 * Verifies that external users get query_by=target_org.
 */
export const ExternalUserUsesQueryByTargetOrg: Story = {
  args: { isInternal: false },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/cross-account-requests/', ({ request }) => {
          const url = new URL(request.url);
          const queryBy = url.searchParams.get('query_by');
          if (queryBy !== 'target_org') {
            return HttpResponse.json(
              {
                errors: [
                  {
                    detail: `Expected query_by=target_org but got query_by=${queryBy}`,
                  },
                ],
              },
              { status: 400 }
            );
          }
          return HttpResponse.json(mockAccessRequestsData);
        }),
        http.get('/api/chrome-service/v1/user/', () =>
          HttpResponse.json({
            ...mockUserData,
            identity: {
              ...mockUserData.identity,
              user: {
                ...mockUserData.identity.user,
                is_internal: false,
                is_org_admin: false,
              },
            },
          })
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () => {
        expect(canvas.getByText('abc-123')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
    expect(
      canvas.queryByText(/Expected query_by=target_org/)
    ).not.toBeInTheDocument();
  },
};
