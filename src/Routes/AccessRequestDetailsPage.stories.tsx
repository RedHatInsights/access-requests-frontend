import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { AccessRequestDetailsPageView } from './AccessRequestDetailsPage';

const meta: Meta<typeof AccessRequestDetailsPageView> = {
  component: AccessRequestDetailsPageView,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
AccessRequestDetailsPageView is the complete page layout component for viewing access request details. It provides a comprehensive view with breadcrumbs, actions, and two-column content layout.

**Key Features:**
- **Dual Views**: Internal (Red Hat employee) vs External (customer) perspectives
- **Breadcrumb Navigation**: Shows context and navigation path
- **Action Dropdown**: Edit/Cancel actions for pending requests (internal view only)
- **Two-Column Layout**: Request details card + roles table
- **Modal Integration**: Supports cancel and edit modal workflows
- **Status-Based Actions**: Different actions available based on request status
- **Responsive Design**: Adapts to different screen sizes

**Internal View**: Full admin capabilities with status management and actions
**External View**: Customer-facing read-only view with decision status
        `,
      },
    },
    msw: {
      handlers: [
        // Mock API responses for access request details
        http.get('/api/rbac/v1/cross-account-requests/*', () => {
          return HttpResponse.json({ status: 'approved' });
        }),
        http.patch('/api/rbac/v1/cross-account-requests/*', () => {
          return HttpResponse.json({ status: 'updated' });
        }),
        // Mock roles list API
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const system = url.searchParams.get('system');

          if (system === 'true') {
            return HttpResponse.json([
              {
                uuid: 'role-1',
                display_name: 'Administrator',
                name: 'administrator',
                description: 'Full system administration access',
                applications: ['console', 'rbac', 'insights'],
                accessCount: 25,
                permissions: 25,
                groups_in_count: 3,
              },
              {
                uuid: 'role-2',
                display_name: 'Cost Management Admin',
                name: 'cost-management-admin',
                description: 'Manage cost reporting and optimization',
                applications: ['cost-management'],
                accessCount: 8,
                permissions: 8,
                groups_in_count: 1,
              },
              {
                uuid: 'role-3',
                display_name: 'Inventory Viewer',
                name: 'inventory-viewer',
                description: 'Read-only access to system inventory',
                applications: ['inventory', 'insights'],
                accessCount: 3,
                permissions: 3,
                groups_in_count: 2,
              },
            ]);
          }

          return HttpResponse.json([]);
        }),
        // Mock individual role permissions API
        http.get('/api/rbac/v1/roles/:roleId/', ({ params }) => {
          const roleId = params.roleId as string;

          // Return mock permissions based on role
          const mockPermissions: Record<string, { permission: string }[]> = {
            'role-1': [
              { permission: 'console:dashboards:read' },
              { permission: 'console:widgets:write' },
              { permission: 'rbac:roles:read' },
              { permission: 'rbac:roles:write' },
              { permission: 'insights:systems:read' },
            ],
            'role-2': [
              { permission: 'cost-management:reports:read' },
              { permission: 'cost-management:budgets:write' },
            ],
            'role-3': [
              { permission: 'inventory:hosts:read' },
              { permission: 'insights:systems:read' },
            ],
          };

          return HttpResponse.json({
            access: mockPermissions[roleId] || [],
          });
        }),
      ],
    },
  },
  decorators: [
    (Story) => {
      // Mock global API_BASE for Storybook environment
      if (typeof window !== 'undefined') {
        (window as any).API_BASE = '/api/rbac/v1';
      }

      return (
        <BrowserRouter>
          <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
            <Story />
          </div>
        </BrowserRouter>
      );
    },
  ],
  argTypes: {
    isInternal: {
      control: 'boolean',
      description: 'Whether this is the internal (Red Hat employee) view',
    },
    isDropdownOpen: {
      control: 'boolean',
      description: 'Whether the actions dropdown is open',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data
const createMockRequest = (
  status: 'pending' | 'approved' | 'denied' | 'cancelled' | 'expired',
  roleCount = 3
) => ({
  request_id: 'AR-2024-001234',
  target_account: '1234567890',
  target_org: '9876543210',
  first_name: 'John',
  last_name: 'Doe',
  start_date: '2024-01-15',
  end_date: '2024-07-15',
  created: '2024-01-10T10:30:00Z',
  status,
  roles: Array.from({ length: roleCount }, (_, i) => ({
    id: `role-${i + 1}`,
    display_name:
      [
        'Administrator',
        'Cost Management Admin',
        'Compliance Admin',
        'Inventory Viewer',
        'Patch Manager',
      ][i] || `Role ${i + 1}`,
    resource_definitions: [],
    description: `Description for role ${i + 1}`,
    applications: ['console', 'insights', 'rbac'],
  })),
});

const mockInternalDisplayProps = [
  'request_id',
  'target_account',
  'target_org',
  'start_date',
  'end_date',
  'created',
];
const mockExternalDisplayProps = [
  'first_name',
  'last_name',
  'start_date',
  'end_date',
  'created',
];

// Base props that most stories will use
const baseProps = {
  requestId: 'AR-2024-001234',
  isDropdownOpen: false,
  openModal: { type: null as 'edit' | 'cancel' | null },
  onDropdownToggle: () => console.log('Dropdown toggled'),
  onModalClose: () => console.log('Modal closed'),
  onActionClick: (params: { type: 'edit' | 'cancel'; requestId: string }) =>
    console.log('Action clicked:', params),
};

// Internal View Stories
export const InternalViewPending: Story = {
  args: {
    ...baseProps,
    isInternal: true,
    request: createMockRequest('pending'),
    requestDisplayProps: mockInternalDisplayProps,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Internal view of a pending request. Shows admin interface with edit/cancel actions in dropdown.',
      },
    },
  },
};

export const InternalViewApproved: Story = {
  args: {
    ...baseProps,
    isInternal: true,
    request: createMockRequest('approved'),
    requestDisplayProps: mockInternalDisplayProps,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Internal view of an approved request. No actions available as request is already processed.',
      },
    },
  },
};

export const InternalViewDenied: Story = {
  args: {
    ...baseProps,
    isInternal: true,
    request: createMockRequest('denied'),
    requestDisplayProps: mockInternalDisplayProps,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Internal view of a denied request. No actions available as request is already processed.',
      },
    },
  },
};

export const InternalViewCancelled: Story = {
  args: {
    ...baseProps,
    isInternal: true,
    request: createMockRequest('cancelled'),
    requestDisplayProps: mockInternalDisplayProps,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Internal view of a cancelled request. No actions available as request was cancelled.',
      },
    },
  },
};

// External View Stories
export const ExternalViewPending: Story = {
  args: {
    ...baseProps,
    isInternal: false,
    request: createMockRequest('pending'),
    requestDisplayProps: mockExternalDisplayProps,
  },
  parameters: {
    docs: {
      description: {
        story:
          'External (customer) view of a pending request. Shows customer information instead of account IDs.',
      },
    },
  },
};

export const ExternalViewApproved: Story = {
  args: {
    ...baseProps,
    isInternal: false,
    request: createMockRequest('approved'),
    requestDisplayProps: mockExternalDisplayProps,
  },
  parameters: {
    docs: {
      description: {
        story:
          'External (customer) view of an approved request. Shows approval status with action buttons.',
      },
    },
  },
};

export const ExternalViewDenied: Story = {
  args: {
    ...baseProps,
    isInternal: false,
    request: createMockRequest('denied'),
    requestDisplayProps: mockExternalDisplayProps,
  },
  parameters: {
    docs: {
      description: {
        story:
          'External (customer) view of a denied request. Shows denial status with action buttons.',
      },
    },
  },
};

// Interactive States
export const InternalWithDropdownOpen: Story = {
  args: {
    ...baseProps,
    isInternal: true,
    request: createMockRequest('pending'),
    requestDisplayProps: mockInternalDisplayProps,
    isDropdownOpen: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Internal view with actions dropdown open, showing available edit and cancel options.',
      },
    },
  },
};

export const WithCancelModal: Story = {
  args: {
    ...baseProps,
    isInternal: true,
    request: createMockRequest('pending'),
    requestDisplayProps: mockInternalDisplayProps,
    openModal: { type: 'cancel' },
  },
  tags: ['!autodocs'],
  parameters: {
    docs: {
      description: {
        story:
          'Page with cancel confirmation modal open. Shows modal overlay and interaction flow.',
      },
    },
  },
};

export const WithEditModal: Story = {
  args: {
    ...baseProps,
    isInternal: true,
    request: createMockRequest('pending'),
    requestDisplayProps: mockInternalDisplayProps,
    openModal: { type: 'edit' },
  },
  tags: ['!autodocs'],
  parameters: {
    docs: {
      description: {
        story:
          'Page with edit wizard modal open. Shows the request editing workflow.',
      },
    },
  },
};

// Loading and Edge Cases
export const LoadingState: Story = {
  args: {
    ...baseProps,
    isInternal: true,
    request: null,
    requestDisplayProps: mockInternalDisplayProps,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Loading state while request data is being fetched. Shows skeleton placeholders.',
      },
    },
  },
};

export const ManyRoles: Story = {
  args: {
    ...baseProps,
    isInternal: true,
    request: createMockRequest('pending', 12),
    requestDisplayProps: mockInternalDisplayProps,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Request with many roles to demonstrate table pagination and scrolling behavior.',
      },
    },
  },
};

export const LongRequestId: Story = {
  args: {
    ...baseProps,
    isInternal: true,
    request: {
      ...createMockRequest('pending'),
      request_id: 'AR-2024-VERY-LONG-REQUEST-IDENTIFIER-001234567890',
    },
    requestId: 'AR-2024-VERY-LONG-REQUEST-IDENTIFIER-001234567890',
    requestDisplayProps: mockInternalDisplayProps,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Request with very long ID to test layout handling of long text content.',
      },
    },
  },
};

// Responsive Layout Test
export const ResponsiveLayout: Story = {
  args: {
    ...baseProps,
    isInternal: true,
    request: createMockRequest('pending'),
    requestDisplayProps: mockInternalDisplayProps,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates responsive layout behavior at different screen sizes.',
      },
    },
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};
