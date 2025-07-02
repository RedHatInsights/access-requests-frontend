import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@patternfly/react-core';
import { Table, Thead, Th, Tr } from '@patternfly/react-table';
import MUANoResults from './MUANoResults';

const meta: Meta<typeof MUANoResults> = {
  component: MUANoResults,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
MUANoResults displays an empty state when no search results are found in the roles table. It shows a helpful message and provides a clear filters action to help users reset their search.

## Usage
This component is typically rendered within a table body when filtering yields no results. It spans across all table columns and provides a user-friendly empty state.
        `,
      },
    },
  },
  decorators: [
    (Story, { args }) => {
      // Create table columns based on the columns prop
      const columnHeaders = args.columns || [
        'Role name',
        'Description',
        'Permissions',
      ];

      return (
        <Table aria-label="Roles table with no results">
          <Thead>
            <Tr>
              {columnHeaders.map((header: string, index: number) => (
                <Th key={index}>{header}</Th>
              ))}
            </Tr>
          </Thead>
          <Story />
        </Table>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof MUANoResults>;

const mockClearButton = (
  <Button variant="link" onClick={() => console.log('Clear filters clicked')}>
    Clear filters
  </Button>
);

export const Default: Story = {
  args: {
    columns: ['Role name', 'Role description', 'Permissions'],
    clearFiltersButton: mockClearButton,
  },
};
