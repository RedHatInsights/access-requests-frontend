import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { StatusLabelView } from './getActions';

const meta: Meta<typeof StatusLabelView> = {
  component: StatusLabelView,
  parameters: {
    docs: {
      description: {
        component: `
StatusLabelView is the presentational component for displaying access request status with optional action buttons. It supports all access request statuses and provides interactive approve/deny functionality.

**Key Features:**
- Five status states with appropriate colors and icons (pending, approved, denied, cancelled, expired)
- Action buttons for approve/deny operations
- Edit mode toggle for approved/denied requests
- Loading states during status updates
- Read-only mode (hideActions) for display-only scenarios
- Fully accessible with proper ARIA labels

**Status Color Coding:**
- **Pending**: Blue with progress icon
- **Approved**: Green with check circle icon  
- **Denied**: Red with exclamation circle icon
- **Cancelled**: Orange with error circle icon
- **Expired**: Grey with clock icon
        `,
      },
    },
  },
  argTypes: {
    onSetEditing: { action: 'editing toggled' },
    onUpdateStatus: { action: 'status updated' },
    status: {
      control: 'select',
      options: ['pending', 'approved', 'denied', 'cancelled', 'expired'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusLabelView>;

// Status States
export const PendingStatus: Story = {
  args: {
    status: 'pending',
    hideActions: false,
    isEditing: false,
    isLoading: false,
  },
};

export const ApprovedStatus: Story = {
  args: {
    status: 'approved',
    hideActions: false,
    isEditing: false,
    isLoading: false,
  },
};

export const DeniedStatus: Story = {
  args: {
    status: 'denied',
    hideActions: false,
    isEditing: false,
    isLoading: false,
  },
};

export const CancelledStatus: Story = {
  args: {
    status: 'cancelled',
    hideActions: false,
    isEditing: false,
    isLoading: false,
  },
};

export const ExpiredStatus: Story = {
  args: {
    status: 'expired',
    hideActions: false,
    isEditing: false,
    isLoading: false,
  },
};

// Interaction States
export const EditingMode: Story = {
  args: {
    status: 'approved',
    hideActions: false,
    isEditing: true,
    isLoading: false,
  },
};

export const LoadingState: Story = {
  args: {
    status: 'pending',
    hideActions: false,
    isEditing: false,
    isLoading: true,
  },
};

export const ReadOnlyMode: Story = {
  args: {
    status: 'approved',
    hideActions: true,
    isEditing: false,
    isLoading: false,
  },
};

// All Status States in Read-Only Mode
export const AllStatusesReadOnly: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <strong>Pending:</strong>{' '}
        <StatusLabelView status="pending" hideActions />
      </div>
      <div>
        <strong>Approved:</strong>{' '}
        <StatusLabelView status="approved" hideActions />
      </div>
      <div>
        <strong>Denied:</strong> <StatusLabelView status="denied" hideActions />
      </div>
      <div>
        <strong>Cancelled:</strong>{' '}
        <StatusLabelView status="cancelled" hideActions />
      </div>
      <div>
        <strong>Expired:</strong>{' '}
        <StatusLabelView status="expired" hideActions />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Comparison view of all status states in read-only mode, showing the different colors and icons for each status.',
      },
    },
  },
};
