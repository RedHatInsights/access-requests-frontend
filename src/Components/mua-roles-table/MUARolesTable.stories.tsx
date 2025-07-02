import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MUARolesTableView, MUARole } from './MUARolesTable';

const meta: Meta<typeof MUARolesTableView> = {
  component: MUARolesTableView,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
MUARolesTableView is the presentational component for displaying roles in both read-only and editable modes. It provides a comprehensive table with selection, filtering, sorting, pagination, and row expansion functionality.

**Key Features:**
- **Dual Mode**: Read-only (just display) vs Editable (full interaction)
- **Selection**: Checkbox selection with bulk operations
- **Filtering**: By role name and application
- **Sorting**: All columns sortable
- **Pagination**: Configurable page sizes
- **Expansion**: Click permissions count to see detailed permissions
- **Loading States**: Skeleton placeholders during data loading
- **Empty States**: No results message with clear filters action

**Read-only Mode**: When \`setSelectedRoles\` is undefined, hides selection checkboxes and toolbar
**Editable Mode**: When \`setSelectedRoles\` is provided, shows full interaction capabilities
        `,
      },
    },
  },
  argTypes: {
    isReadOnly: {
      control: 'boolean',
      description: 'Whether table is in read-only mode (no selection/editing)',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data that matches the MUARole interface
const createMockRole = (
  id: number,
  name: string,
  description: string,
  apps: string[],
  permissions: number,
  isExpanded = false,
  access?: string[][]
): MUARole => ({
  uuid: `role-${id}`,
  display_name: name,
  name: name.toLowerCase().replace(/\s+/g, '-'),
  description,
  applications: apps,
  accessCount: permissions,
  permissions,
  isExpanded,
  access,
  groups_in_count: Math.floor(Math.random() * 5) + 1,
});

const mockRoles: MUARole[] = [
  createMockRole(
    1,
    'Administrator',
    'Full system administration access with all privileges',
    ['console', 'rbac', 'insights'],
    25
  ),
  createMockRole(
    2,
    'Cost Management Admin',
    'Manage cost reporting and optimization features',
    ['cost-management'],
    8
  ),
  createMockRole(
    3,
    'Compliance Admin',
    'Configure and manage compliance policies and scans',
    ['compliance'],
    12
  ),
  createMockRole(
    4,
    'Inventory Viewer',
    'Read-only access to system inventory and host information',
    ['inventory', 'insights'],
    3
  ),
  createMockRole(
    5,
    'Patch Manager',
    'Manage system patches and updates across the fleet',
    ['patch', 'insights'],
    15
  ),
  createMockRole(
    6,
    'Subscriptions Viewer',
    'View subscription usage and entitlements',
    ['subscriptions'],
    2
  ),
  createMockRole(
    7,
    'Developer',
    'Development access to selected applications and services',
    ['console', 'insights'],
    18,
    true,
    [
      ['console', 'dashboards', 'read'],
      ['console', 'widgets', 'write'],
      ['insights', 'systems', 'read'],
      ['insights', 'reports', 'read'],
    ]
  ),
];

const applications = [
  'console',
  'rbac',
  'insights',
  'cost-management',
  'compliance',
  'inventory',
  'patch',
  'subscriptions',
];

// Base props that most stories will use
const baseProps = {
  rows: mockRoles,
  applications,
  filteredRows: mockRoles,
  pagedRows: mockRoles.slice(0, 5),
  perPage: 5,
  page: 1,
  anySelected: false,
  isChecked: false,
  error: null,
  hasFilters: false,
  nameFilter: '',
  appSelections: [],
  activeSortIndex: 0,
  activeSortDirection: 'asc' as const,
  selectedRoles: [],
  onExpand: (role: MUARole) => console.log('Expand role:', role.display_name),
  isRoleExpanded: (role: MUARole) => role.isExpanded || false,
  onSort: (event: React.MouseEvent, index: number, direction: 'asc' | 'desc') =>
    console.log('Sort:', index, direction),
  onSetPage: (event: any, page: number) => console.log('Set page:', page),
  onPerPageSelect: (event: any, perPage: number) =>
    console.log('Per page:', perPage),
  setNameFilter: (filter: string) => console.log('Name filter:', filter),
  setAppSelections: (() => {}) as React.Dispatch<
    React.SetStateAction<string[]>
  >,
  setSelectedRoles: (roles: string[]) => console.log('Selected roles:', roles),
  clearFilters: () => console.log('Clear filters'),
  onSelectAll: (event: any, isSelected: boolean) =>
    console.log('Select all:', isSelected),
};

// Read-only Mode Stories
export const ReadOnlyMode: Story = {
  args: {
    ...baseProps,
    isReadOnly: true,
    selectedRoles: ['Administrator', 'Developer'],
    pagedRows: mockRoles.filter((role) =>
      ['Administrator', 'Developer'].includes(role.display_name)
    ),
    filteredRows: mockRoles.filter((role) =>
      ['Administrator', 'Developer'].includes(role.display_name)
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Read-only mode showing only selected roles. No checkboxes, toolbar, or "Select roles" title.',
      },
    },
  },
};

// Editable Mode Stories
export const EditableMode: Story = {
  args: {
    ...baseProps,
    isReadOnly: false,
    onSelect: (
      event: React.FormEvent<HTMLInputElement>,
      isSelected: boolean,
      rowIndex: number
    ) => console.log('Row select:', rowIndex, isSelected),
    getIsRowSelected: (roleName: string) =>
      ['Administrator', 'Developer'].includes(roleName),
    selectedRoles: ['Administrator', 'Developer'],
    anySelected: true,
    isChecked: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Editable mode with selection capabilities. Shows checkboxes, toolbar, and "Select roles" title.',
      },
    },
  },
};

export const AllSelected: Story = {
  args: {
    ...baseProps,
    isReadOnly: false,
    onSelect: (
      event: React.FormEvent<HTMLInputElement>,
      isSelected: boolean,
      rowIndex: number
    ) => console.log('Row select:', rowIndex, isSelected),
    getIsRowSelected: () => true,
    selectedRoles: mockRoles.map((role) => role.display_name),
    anySelected: true,
    isChecked: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'All roles selected state with checked "select all" checkbox.',
      },
    },
  },
};

// Filtering Stories
export const WithFilters: Story = {
  args: {
    ...baseProps,
    isReadOnly: false,
    onSelect: (
      event: React.FormEvent<HTMLInputElement>,
      isSelected: boolean,
      rowIndex: number
    ) => console.log('Row select:', rowIndex, isSelected),
    getIsRowSelected: () => false,
    hasFilters: true,
    nameFilter: 'admin',
    appSelections: ['console', 'insights'],
    filteredRows: mockRoles.filter((role) =>
      role.display_name.toLowerCase().includes('admin')
    ),
    pagedRows: mockRoles
      .filter((role) => role.display_name.toLowerCase().includes('admin'))
      .slice(0, 5),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Table with active filters applied. Shows filtered results and filter chips.',
      },
    },
  },
};

export const NoResults: Story = {
  args: {
    ...baseProps,
    isReadOnly: false,
    onSelect: (
      event: React.FormEvent<HTMLInputElement>,
      isSelected: boolean,
      rowIndex: number
    ) => console.log('Row select:', rowIndex, isSelected),
    getIsRowSelected: () => false,
    hasFilters: true,
    nameFilter: 'nonexistent',
    appSelections: ['nonexistent-app'],
    filteredRows: [],
    pagedRows: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'No results found when filters yield no matches. Shows empty state with clear filters action.',
      },
    },
  },
};

// Loading States
export const LoadingState: Story = {
  args: {
    ...baseProps,
    isReadOnly: false,
    rows: [],
    filteredRows: [],
    pagedRows: [],
    onSelect: (
      event: React.FormEvent<HTMLInputElement>,
      isSelected: boolean,
      rowIndex: number
    ) => console.log('Row select:', rowIndex, isSelected),
    getIsRowSelected: () => false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Loading state showing skeleton placeholders while data is being fetched.',
      },
    },
  },
};

// Expanded Rows
export const WithExpandedRows: Story = {
  args: {
    ...baseProps,
    isReadOnly: false,
    onSelect: (
      event: React.FormEvent<HTMLInputElement>,
      isSelected: boolean,
      rowIndex: number
    ) => console.log('Row select:', rowIndex, isSelected),
    getIsRowSelected: () => false,
    pagedRows: [
      createMockRole(
        1,
        'Administrator',
        'Full system administration access',
        ['console', 'rbac'],
        15,
        true,
        [
          ['console', 'dashboards', 'read'],
          ['console', 'dashboards', 'write'],
          ['rbac', 'roles', 'read'],
          ['rbac', 'roles', 'write'],
          ['rbac', 'users', 'read'],
        ]
      ),
      createMockRole(
        2,
        'Developer',
        'Development access to applications',
        ['console', 'insights'],
        8,
        true,
        [
          ['console', 'widgets', 'read'],
          ['console', 'widgets', 'write'],
          ['insights', 'systems', 'read'],
        ]
      ),
    ],
    filteredRows: mockRoles.slice(0, 2),
    isRoleExpanded: () => true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Roles with expanded permission details showing the nested permissions table.',
      },
    },
  },
};

// Pagination Stories
export const LargeDataset: Story = {
  args: {
    ...baseProps,
    isReadOnly: false,
    onSelect: (
      event: React.FormEvent<HTMLInputElement>,
      isSelected: boolean,
      rowIndex: number
    ) => console.log('Row select:', rowIndex, isSelected),
    getIsRowSelected: () => false,
    page: 2,
    perPage: 3,
    pagedRows: mockRoles.slice(3, 6),
    filteredRows: mockRoles,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Table showing page 2 of a larger dataset with pagination controls.',
      },
    },
  },
};

// Error State
export const ErrorState: Story = {
  args: {
    ...baseProps,
    error:
      'Failed to load roles data. Please check your connection and try again.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Error state when role data fails to load. Shows error message and retry button.',
      },
    },
  },
};

// Different Sort States
export const SortedByDescription: Story = {
  args: {
    ...baseProps,
    isReadOnly: false,
    onSelect: (
      event: React.FormEvent<HTMLInputElement>,
      isSelected: boolean,
      rowIndex: number
    ) => console.log('Row select:', rowIndex, isSelected),
    getIsRowSelected: () => false,
    activeSortIndex: 1,
    activeSortDirection: 'desc',
    pagedRows: [...mockRoles]
      .sort((a, b) => b.description.localeCompare(a.description))
      .slice(0, 5),
  },
  parameters: {
    docs: {
      description: {
        story: 'Table sorted by description column in descending order.',
      },
    },
  },
};
