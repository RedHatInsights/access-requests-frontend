import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@patternfly/react-core';
import { EmptyStateView } from './EmptyStateView';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';
import PlusCircleIcon from '@patternfly/react-icons/dist/js/icons/plus-circle-icon';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import CubesIcon from '@patternfly/react-icons/dist/js/icons/cubes-icon';

const meta: Meta<typeof EmptyStateView> = {
  component: EmptyStateView,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Reusable empty state component that provides consistent messaging for various empty data scenarios across the application.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['xs', 'sm', 'lg', 'xl', 'full'],
    },
    headingLevel: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Create action buttons for stories
const createButton = <Button variant="primary">Create request</Button>;

const clearFiltersButton = <Button variant="link">Clear filters</Button>;

const retryButton = <Button variant="primary">Retry</Button>;

const multipleActions = [
  <Button key="primary" variant="primary">
    Create new
  </Button>,
  <Button key="secondary" variant="secondary">
    Import
  </Button>,
];

// Basic Empty States
export const NoDataLarge: Story = {
  args: {
    title: 'No access requests',
    description: 'Click the button below to create an access request.',
    icon: PlusCircleIcon,
    variant: 'lg',
    headingLevel: 'h3',
    actions: createButton,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Large empty state typically used when there is no data at all. Shows prominent call-to-action.',
      },
    },
  },
};

export const NoSearchResults: Story = {
  args: {
    title: 'No matching requests found',
    description:
      'No results match the filter criteria. Remove all filters or clear all filters to show results.',
    icon: SearchIcon,
    variant: 'sm',
    headingLevel: 'h2',
    actions: clearFiltersButton,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Small empty state used when search/filtering yields no results. Provides action to clear filters.',
      },
    },
  },
};

// Error States
export const ErrorState: Story = {
  args: {
    title: 'An error occurred',
    description:
      'Something went wrong while loading the data. Please try again.',
    icon: ExclamationCircleIcon,
    iconColor: '#C9190B',
    variant: 'lg',
    headingLevel: 'h2',
    actions: retryButton,
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state with red warning icon and retry action.',
      },
    },
  },
};

// Different Variants
export const ExtraSmall: Story = {
  args: {
    title: 'No items',
    description: 'There are no items to display.',
    icon: CubesIcon,
    variant: 'xs',
  },
  parameters: {
    docs: {
      description: {
        story: 'Extra small variant for minimal empty states.',
      },
    },
  },
};

export const ExtraLarge: Story = {
  args: {
    title: 'Welcome to Access Requests',
    description:
      'Get started by creating your first access request or explore the documentation to learn more.',
    icon: PlusCircleIcon,
    variant: 'xl',
    headingLevel: 'h1',
    actions: createButton,
  },
  parameters: {
    docs: {
      description: {
        story: 'Extra large variant for prominent landing page empty states.',
      },
    },
  },
};

// Multiple Actions
export const MultipleActions: Story = {
  args: {
    title: 'No data sources configured',
    description:
      'You can create a new data source or import from an existing configuration.',
    icon: CubesIcon,
    variant: 'lg',
    actions: multipleActions,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state with multiple action buttons in the footer.',
      },
    },
  },
};

// Minimal States
export const TitleOnly: Story = {
  args: {
    title: 'Empty',
    variant: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal empty state with just a title.',
      },
    },
  },
};

export const NoIcon: Story = {
  args: {
    title: 'No configuration found',
    description: 'The system configuration is missing or incomplete.',
    variant: 'sm',
    actions: retryButton,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state without an icon for text-only messaging.',
      },
    },
  },
};

// Real-world Examples from Codebase
export const CustomerViewNoRequests: Story = {
  args: {
    title: 'You have no access requests',
    description: 'You have no pending Red Hat access requests.',
    icon: PlusCircleIcon,
    variant: 'lg',
    headingLevel: 'h3',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Customer view when they have no access requests (no create button since they cannot create).',
      },
    },
  },
};

export const PermissionError: Story = {
  args: {
    title: 'Invalid Account number',
    description:
      'The account number provided is not valid or you do not have permission to access it.',
    icon: ExclamationCircleIcon,
    iconColor: '#C9190B',
    variant: 'lg',
    headingLevel: 'h2',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Error state for permission or validation issues (no retry action).',
      },
    },
  },
};
