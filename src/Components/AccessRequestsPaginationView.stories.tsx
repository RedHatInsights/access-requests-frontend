import type { Meta, StoryObj } from '@storybook/react';
import { AccessRequestsPaginationView } from './AccessRequestsTable';

const meta: Meta<typeof AccessRequestsPaginationView> = {
  component: AccessRequestsPaginationView,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Pagination controls for access requests table with configurable per-page options and compact top/bottom variants.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TopPagination: Story = {
  args: {
    itemCount: 127,
    perPage: 20,
    page: 1,
    onSetPage: (page: number) => console.log('Page changed to:', page),
    onPerPageSelect: (perPage: number) =>
      console.log('Per page changed to:', perPage),
    id: 'top',
    isCompact: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Compact pagination typically used at the top of tables. Shows fewer controls to save space.',
      },
    },
  },
};

export const BottomPagination: Story = {
  args: {
    itemCount: 127,
    perPage: 20,
    page: 1,
    onSetPage: (page: number) => console.log('Page changed to:', page),
    onPerPageSelect: (perPage: number) =>
      console.log('Per page changed to:', perPage),
    id: 'bottom',
    isCompact: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Full pagination controls typically used at the bottom of tables. Shows complete pagination interface.',
      },
    },
  },
};

export const MiddlePage: Story = {
  args: {
    itemCount: 127,
    perPage: 20,
    page: 4,
    onSetPage: (page: number) => console.log('Page changed to:', page),
    onPerPageSelect: (perPage: number) =>
      console.log('Per page changed to:', perPage),
    id: 'bottom',
    isCompact: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows pagination controls when user is on a middle page with navigation options in both directions.',
      },
    },
  },
};

export const LastPage: Story = {
  args: {
    itemCount: 127,
    perPage: 20,
    page: 7,
    onSetPage: (page: number) => console.log('Page changed to:', page),
    onPerPageSelect: (perPage: number) =>
      console.log('Per page changed to:', perPage),
    id: 'bottom',
    isCompact: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Pagination controls when user is on the last page, showing navigation constraints.',
      },
    },
  },
};

export const SmallDataset: Story = {
  args: {
    itemCount: 8,
    perPage: 10,
    page: 1,
    onSetPage: (page: number) => console.log('Page changed to:', page),
    onPerPageSelect: (perPage: number) =>
      console.log('Per page changed to:', perPage),
    id: 'bottom',
    isCompact: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Pagination with a small dataset that fits on a single page.',
      },
    },
  },
};

export const LargeDataset: Story = {
  args: {
    itemCount: 2847,
    perPage: 50,
    page: 15,
    onSetPage: (page: number) => console.log('Page changed to:', page),
    onPerPageSelect: (perPage: number) =>
      console.log('Per page changed to:', perPage),
    id: 'bottom',
    isCompact: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Pagination with a large dataset showing many pages and higher per-page count.',
      },
    },
  },
};
