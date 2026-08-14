import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import AccessRequestsPage from './AccessRequestsPage';

// Common mock data
const mockAccessRequestsData = {
  meta: {
    count: 3,
    limit: 20,
    offset: 0,
  },
  data: [
    {
      request_id: '12345',
      target_org: '7654321',
      status: 'pending',
      start_date: '2024-01-15T10:00:00Z',
      end_date: '2024-02-15T10:00:00Z',
      created: '2024-01-10T08:30:00Z',
      user_id: 'user123',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      roles: [
        {
          name: 'Viewer',
          description: 'Read-only access to resources',
        },
      ],
    },
    {
      request_id: '12346',
      target_org: '7654322',
      status: 'approved',
      start_date: '2024-01-01T10:00:00Z',
      end_date: '2024-02-01T10:00:00Z',
      created: '2023-12-28T14:20:00Z',
      user_id: 'user456',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      roles: [
        {
          name: 'Viewer',
          description: 'Read-only access to resources',
        },
      ],
    },
    {
      request_id: '12347',
      target_org: '7654323',
      status: 'denied',
      start_date: '2024-01-20T10:00:00Z',
      end_date: '2024-02-20T10:00:00Z',
      created: '2024-01-15T16:45:00Z',
      user_id: 'user789',
      first_name: 'Bob',
      last_name: 'Johnson',
      email: 'bob.johnson@example.com',
      roles: [
        {
          name: 'Viewer',
          description: 'Read-only access to resources',
        },
      ],
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
      is_org_admin: false,
      email: 'johndoe@example.com',
      user_id: '12345',
      account_number: '1234567',
      org_id: '7654321',
    },
    account: {
      account_number: '1234567',
      org_id: '7654321',
    },
    internal: {
      org_id: '7654321',
    },
  },
  entitlements: {},
  token: 'mock-jwt-token',
};

// Common handlers for stories with data
const commonHandlers = [
  http.get('/api/rbac/v1/cross-account-requests/', () => {
    return HttpResponse.json(mockAccessRequestsData);
  }),
  http.get('/api/chrome-service/v1/user/', () => {
    return HttpResponse.json(mockUserData);
  }),
];

const meta: Meta<typeof AccessRequestsPage> = {
  component: AccessRequestsPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The Access Requests page displays a table of all submitted requests for read-only account access. It supports both internal (Red Hat employees) and external (customers) views.',
      },
    },
  },
  argTypes: {
    isInternal: {
      control: 'boolean',
      description:
        'Determines the view type for the access requests table. True for internal Red Hat employees view, false for external customers view.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AccessRequestsPage>;

// Internal view story
export const InternalView: Story = {
  tags: ['autodocs'],
  args: {
    isInternal: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Internal view for Red Hat employees - shows account info and allows creating requests.',
      },
    },
    msw: {
      handlers: commonHandlers,
    },
  },
};

// External view story (explicit)
export const ExternalView: Story = {
  tags: ['autodocs'],
  args: {
    isInternal: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'External view for customers - shows user info and is read-only.',
      },
    },
    msw: {
      handlers: commonHandlers,
    },
  },
};

// Empty state story
export const EmptyState: Story = {
  args: {
    isInternal: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the empty state when no access requests are available.',
      },
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/cross-account-requests/', () => {
          return HttpResponse.json({
            meta: {
              count: 0,
              limit: 20,
              offset: 0,
            },
            data: [],
          });
        }),
        http.get('/api/chrome-service/v1/user/', () => {
          return HttpResponse.json({
            identity: {
              user: {
                first_name: 'John',
                last_name: 'Doe',
                username: 'johndoe@example.com',
                is_internal: false,
                is_org_admin: false,
                email: 'johndoe@example.com',
                user_id: '12345',
                account_number: '1234567',
                org_id: '7654321',
              },
            },
          });
        }),
      ],
    },
  },
};
