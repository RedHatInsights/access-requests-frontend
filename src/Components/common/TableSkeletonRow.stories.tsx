import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Table, Thead, Tr, Th } from '@patternfly/react-table';
import { TableSkeletonRowView } from './TableSkeletonRow';

const meta: Meta<typeof TableSkeletonRowView> = {
  component: TableSkeletonRowView,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Loading skeleton rows for tables. Creates placeholder content that matches the table structure during data loading.',
      },
    },
  },
  decorators: [
    (Story, { args }) => (
      <Table aria-label="Example table with skeleton loading">
        <Thead>
          <Tr>
            {args.hasCheckboxColumn && <Th />}
            {args.columns.map((col: string, index: number) => (
              <Th key={index}>{col}</Th>
            ))}
            {args.hasActionColumn && <Th />}
          </Tr>
        </Thead>
        <Story />
      </Table>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const basicColumns = ['Request ID', 'Account', 'Created', 'Status'];
const roleColumns = ['Role name', 'Application', 'Permissions'];
const manyColumns = [
  'ID',
  'Name',
  'Type',
  'Owner',
  'Created',
  'Modified',
  'Status',
  'Priority',
];

export const BasicTable: Story = {
  args: {
    columns: basicColumns,
    rowCount: 5,
    skeletonHeight: 22,
    hasCheckboxColumn: false,
    hasActionColumn: false,
    skeletonSize: 'md',
  },
};

export const SelectableTable: Story = {
  args: {
    columns: basicColumns,
    rowCount: 3,
    skeletonHeight: 22,
    hasCheckboxColumn: true,
    hasActionColumn: false,
    skeletonSize: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with checkbox column for row selection.',
      },
    },
  },
};

export const WithActions: Story = {
  args: {
    columns: basicColumns,
    rowCount: 4,
    skeletonHeight: 22,
    hasCheckboxColumn: false,
    hasActionColumn: true,
    skeletonSize: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with action column for row-level operations.',
      },
    },
  },
};

export const RolesTable: Story = {
  args: {
    columns: roleColumns,
    rowCount: 3,
    skeletonHeight: 22,
    hasCheckboxColumn: true,
    hasActionColumn: false,
    skeletonSize: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton for roles table with selectable rows.',
      },
    },
  },
};

export const SmallSkeletons: Story = {
  args: {
    columns: roleColumns,
    rowCount: 3,
    skeletonHeight: 18,
    hasCheckboxColumn: false,
    hasActionColumn: false,
    skeletonSize: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Smaller skeleton elements for compact tables.',
      },
    },
  },
};

export const LargeSkeletons: Story = {
  args: {
    columns: basicColumns,
    rowCount: 2,
    skeletonHeight: 30,
    hasCheckboxColumn: false,
    hasActionColumn: false,
    skeletonSize: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Larger skeleton elements for expanded table rows.',
      },
    },
  },
};

export const ManyColumns: Story = {
  args: {
    columns: manyColumns,
    rowCount: 2,
    skeletonHeight: 22,
    hasCheckboxColumn: true,
    hasActionColumn: true,
    skeletonSize: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with many columns, checkbox, and action columns.',
      },
    },
  },
};

export const SingleRow: Story = {
  args: {
    columns: basicColumns,
    rowCount: 1,
    skeletonHeight: 22,
    hasCheckboxColumn: false,
    hasActionColumn: false,
    skeletonSize: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'Single skeleton row for minimal loading states.',
      },
    },
  },
};
