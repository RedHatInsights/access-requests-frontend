import type { Meta, StoryObj } from '@storybook/react';
import { AccessRequestDetailsPageView } from './AccessRequestDetailsPageView';

const meta: Meta<typeof AccessRequestDetailsPageView> = {
  component: AccessRequestDetailsPageView,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Display view for access request details page showing request information, roles table, and available actions.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Base request object for reuse
const baseRequest = {
  request_id: 'AR-2024-001234',
  target_org: '9876543210',
  first_name: 'John',
  last_name: 'Doe',
  start_date: '2024-01-15',
  end_date: '2024-07-15',
  created: '2024-01-10T10:30:00Z',
  status: 'pending' as const,
  roles: Array.from({ length: 3 }, (_, i) => ({
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
};

// Base args for reuse
const baseArgs = {
  isInternal: true,
  requestId: 'AR-2024-001234',
  requestDisplayProps: [
    'target_org',
    'first_name',
    'last_name',
    'start_date',
    'end_date',
    'created',
    'status',
  ],
  isDropdownOpen: false,
  openModal: { type: null as 'edit' | 'cancel' | null },
  request: baseRequest,
};

export const Default: Story = {
  args: baseArgs,
  parameters: {
    docs: {
      description: {
        story:
          'Default view of the access request details page showing a pending request with roles and available actions.',
      },
    },
  },
};

export const ExternalView: Story = {
  args: {
    ...baseArgs,
    isInternal: false,
    request: {
      ...baseRequest,
      status: 'approved' as const,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'External view of the access request details page (customer view) with no action buttons.',
      },
    },
  },
};

export const WithoutRoles: Story = {
  args: {
    ...baseArgs,
    request: {
      ...baseRequest,
      roles: [],
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Access request details page with no roles requested.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    ...baseArgs,
    request: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state of the access request details page.',
      },
    },
  },
};
