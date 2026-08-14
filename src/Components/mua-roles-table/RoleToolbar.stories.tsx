import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import RoleToolbar from './RoleToolbar';

// Interface for mock role data (matches what RoleToolbar expects)
interface RoleRow {
  display_name: string;

  [key: string]: any;
}

const meta: Meta<typeof RoleToolbar> = {
  component: RoleToolbar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
RoleToolbar provides the filtering, search, selection, and pagination controls for the roles table. It includes:

**Key Features:**
- **Bulk Selection**: Checkbox with dropdown for selecting none/page/all items
- **Dynamic Filtering**: Toggle between role name text search and application multi-select
- **Filter Management**: Shows active filters as removable labels
- **Pagination Integration**: Displays pagination controls on the right
- **Selection State**: Shows count of selected items and provides bulk operations

**Filter Modes:**
- **Role Name**: Text input for searching by role name
- **Application**: Multi-select dropdown for filtering by applications

**Selection Features:**
- Individual checkbox for bulk select state
- Dropdown with options: Select none, Select page, Select all
- Shows selection count when items are selected
        `,
      },
    },
  },
  argTypes: {
    selectedRoles: {
      control: 'object',
      description: 'Array of selected role display names',
    },
    isPageSelected: {
      control: 'boolean',
      description: 'Whether the bulk select checkbox is checked',
    },
    isPagePartiallySelected: {
      control: 'boolean',
      description: 'Whether the bulk select checkbos is partially checked',
    },
    nameFilter: {
      control: 'text',
      description: 'Current name filter value',
    },
    appSelections: {
      control: 'object',
      description: 'Array of selected application filters',
    },
    perPage: {
      control: 'number',
      description: 'Number of items per page',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data that matches the RoleRow interface
const createMockRole = (id: number, name: string, apps: string[]): RoleRow => ({
  display_name: name,
  uuid: `role-${id}`,
  name: name.toLowerCase().replace(/\s+/g, '-'),
  applications: apps,
  permissions: Math.floor(Math.random() * 25) + 1,
});

const mockRoles: RoleRow[] = [
  createMockRole(1, 'Administrator', ['console', 'rbac', 'insights']),
  createMockRole(2, 'Cost Management Admin', ['cost-management']),
  createMockRole(3, 'Compliance Admin', ['compliance']),
  createMockRole(4, 'Inventory Viewer', ['inventory', 'insights']),
  createMockRole(5, 'Patch Manager', ['patch', 'insights']),
  createMockRole(6, 'Subscriptions Viewer', ['subscriptions']),
  createMockRole(7, 'Developer', ['console', 'insights']),
  createMockRole(8, 'Security Admin', ['insights', 'compliance']),
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

const columns = ['Role name', 'Description', 'Permissions', 'Applications'];

// Mock pagination component
const MockPagination: React.FC<{ id: string }> = ({ id }) => (
  <div
    style={{
      padding: '8px 16px',
      border: '1px dashed #ccc',
      borderRadius: '4px',
      fontSize: '14px',
      color: '#666',
    }}
  >
    Pagination ({id})
  </div>
);

// Base props that most stories will use
const baseProps = {
  columns,
  rows: mockRoles,
  filteredRows: mockRoles,
  pagedRows: mockRoles.slice(0, 5),
  applications,
  perPage: 5,
  AccessRequestsPagination: MockPagination,
  setSelectedRoles: (roles: string[]) => console.log('Selected roles:', roles),
  setAppSelections: (() => {}) as React.Dispatch<
    React.SetStateAction<string[]>
  >,
  setNameFilter: (filter: string) => console.log('Name filter:', filter),
};

// Default state - no selections, no filters
export const Default: Story = {
  args: {
    ...baseProps,
    selectedRoles: [],
    isPageSelected: false,
    isPagePartiallySelected: false,
    appSelections: [],
    nameFilter: '',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default toolbar state with no selections or active filters. Shows bulk select checkbox and filter controls.',
      },
    },
  },
};

// With some roles selected
export const WithSelectedRoles: Story = {
  args: {
    ...baseProps,
    selectedRoles: ['Administrator', 'Developer', 'Security Admin'],
    isPageSelected: false, // Indeterminate state - some but not all selected
    isPagePartiallySelected: true,
    appSelections: [],
    nameFilter: '',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Toolbar showing selected roles count in the bulk select dropdown. Demonstrates the selection state display.',
      },
    },
  },
};

// All roles selected
export const AllSelected: Story = {
  args: {
    ...baseProps,
    selectedRoles: mockRoles.map((role) => role.display_name),
    isPageSelected: true,
    isPagePartiallySelected: false,
    appSelections: [],
    nameFilter: '',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Toolbar with all roles selected. Shows checked bulk select checkbox and full selection count.',
      },
    },
  },
};

// With name filter applied
export const WithRoleFilter: Story = {
  args: {
    ...baseProps,
    selectedRoles: ['Administrator', 'Developer'],
    isPageSelected: false,
    isPagePartiallySelected: true,
    appSelections: [],
    nameFilter: 'admin',
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
          'Toolbar with an active name filter. Shows the filter value in the text input and displays the filter as a removable label.',
      },
    },
  },
};

// With application filters applied
export const WithApplicationFilters: Story = {
  args: {
    ...baseProps,
    selectedRoles: [],
    isPageSelected: false,
    isPagePartiallySelected: false,
    appSelections: ['insights', 'console'],
    nameFilter: '',
    filteredRows: mockRoles.filter((role) =>
      role.applications?.some((app: string) =>
        ['insights', 'console'].includes(app)
      )
    ),
    pagedRows: mockRoles
      .filter((role) =>
        role.applications?.some((app: string) =>
          ['insights', 'console'].includes(app)
        )
      )
      .slice(0, 5),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Toolbar with application filters applied. Filter dropdown is set to "Application" mode and shows selected apps as removable labels.',
      },
    },
  },
};

// With both filters and selections
export const WithFiltersAndSelections: Story = {
  args: {
    ...baseProps,
    selectedRoles: ['Administrator', 'Developer'],
    isPageSelected: false,
    isPagePartiallySelected: true,
    appSelections: ['insights'],
    nameFilter: 'admin',
    filteredRows: mockRoles.filter(
      (role) =>
        role.display_name.toLowerCase().includes('admin') &&
        role.applications?.includes('insights')
    ),
    pagedRows: mockRoles
      .filter(
        (role) =>
          role.display_name.toLowerCase().includes('admin') &&
          role.applications?.includes('insights')
      )
      .slice(0, 5),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Complex state with both active filters and selected roles. Shows how the toolbar handles multiple active states simultaneously.',
      },
    },
  },
};

// Empty state - no roles
export const EmptyState: Story = {
  args: {
    ...baseProps,
    rows: [],
    filteredRows: [],
    pagedRows: [],
    selectedRoles: [],
    isPageSelected: false,
    isPagePartiallySelected: false,
    appSelections: [],
    nameFilter: '',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Toolbar in empty state when there are no roles. Bulk select controls are disabled.',
      },
    },
  },
};

// No results after filtering
export const NoFilterResults: Story = {
  args: {
    ...baseProps,
    rows: mockRoles, // Full data exists
    filteredRows: [], // But no results after filtering
    pagedRows: [],
    selectedRoles: [],
    isPageSelected: false,
    isPagePartiallySelected: false,
    appSelections: ['nonexistent-app'],
    nameFilter: 'xyz',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Toolbar state when filters are applied but yield no results. Shows active filters but no selectable content.',
      },
    },
  },
};
