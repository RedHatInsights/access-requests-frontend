import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RequestDetailsCardView } from './AccessRequestDetailsPage';

const meta: Meta<typeof RequestDetailsCardView> = {
  component: RequestDetailsCardView,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
RequestDetailsCardView is the presentational component for displaying access request details in a card format. It provides different views for internal Red Hat employees vs external customers.

**Key Features:**
- **Internal View**: Shows status label with color coding
- **External View**: Shows interactive StatusLabel with approve/deny actions
- **Dynamic Properties**: Displays configurable request properties
- **Loading State**: Shows spinner while data is loading
- **Responsive Layout**: PatternFly Card with proper spacing

**View Differences:**
- **Internal**: "Request status" with color-coded Label component
- **External**: "Request decision" with interactive StatusLabel component (approve/deny buttons)
        `,
      },
    },
  },
  argTypes: {
    isInternal: {
      control: 'boolean',
      description: 'Whether this is the internal (Red Hat employee) view',
    },
    status: {
      control: 'select',
      options: ['pending', 'approved', 'denied', 'cancelled', 'expired'],
      description: 'The access request status',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the component is in loading state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RequestDetailsCardView>;

// Sample request data
const sampleRequestData = {
  account_id: '12345',
  first_name: 'John',
  last_name: 'Doe',
  target_account: '67890',
  created: '2024-01-15',
  start_date: '2024-01-20',
  end_date: '2024-02-20',
};

const sampleDisplayProps = [
  'account_id',
  'first_name',
  'last_name',
  'target_account',
  'created',
  'start_date',
  'end_date',
];

// Internal View Stories
export const InternalViewPending: Story = {
  args: {
    isInternal: true,
    status: 'pending',
    requestId: 'REQ-12345',
    displayProps: sampleDisplayProps,
    requestData: sampleRequestData,
    isLoading: false,
  },
};

export const InternalViewApproved: Story = {
  args: {
    isInternal: true,
    status: 'approved',
    requestId: 'REQ-12345',
    displayProps: sampleDisplayProps,
    requestData: sampleRequestData,
    isLoading: false,
  },
};

export const InternalViewDenied: Story = {
  args: {
    isInternal: true,
    status: 'denied',
    requestId: 'REQ-12345',
    displayProps: sampleDisplayProps,
    requestData: sampleRequestData,
    isLoading: false,
  },
};

// External View Stories
export const ExternalViewPending: Story = {
  args: {
    isInternal: false,
    status: 'pending',
    requestId: 'REQ-12345',
    displayProps: sampleDisplayProps,
    requestData: sampleRequestData,
    isLoading: false,
  },
};

export const ExternalViewApproved: Story = {
  args: {
    isInternal: false,
    status: 'approved',
    requestId: 'REQ-12345',
    displayProps: sampleDisplayProps,
    requestData: sampleRequestData,
    isLoading: false,
  },
};

// Loading States
export const LoadingState: Story = {
  args: {
    isInternal: true,
    status: 'pending',
    requestId: 'REQ-12345',
    displayProps: sampleDisplayProps,
    requestData: {},
    isLoading: true,
  },
};

// Minimal Data
export const MinimalData: Story = {
  args: {
    isInternal: true,
    status: 'pending',
    requestId: 'REQ-12345',
    displayProps: ['account_id', 'created'],
    requestData: {
      account_id: '12345',
      created: '2024-01-15',
    },
    isLoading: false,
  },
};

// All Status Comparison
export const AllStatusesInternal: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px',
      }}
    >
      <div>
        <h3 style={{ marginBottom: '8px' }}>Pending</h3>
        <RequestDetailsCardView
          isInternal={true}
          status="pending"
          requestId="REQ-1"
          displayProps={['account_id', 'created']}
          requestData={{ account_id: '12345', created: '2024-01-15' }}
        />
      </div>
      <div>
        <h3 style={{ marginBottom: '8px' }}>Approved</h3>
        <RequestDetailsCardView
          isInternal={true}
          status="approved"
          requestId="REQ-2"
          displayProps={['account_id', 'created']}
          requestData={{ account_id: '12345', created: '2024-01-15' }}
        />
      </div>
      <div>
        <h3 style={{ marginBottom: '8px' }}>Denied</h3>
        <RequestDetailsCardView
          isInternal={true}
          status="denied"
          requestId="REQ-3"
          displayProps={['account_id', 'created']}
          requestData={{ account_id: '12345', created: '2024-01-15' }}
        />
      </div>
      <div>
        <h3 style={{ marginBottom: '8px' }}>Cancelled</h3>
        <RequestDetailsCardView
          isInternal={true}
          status="cancelled"
          requestId="REQ-4"
          displayProps={['account_id', 'created']}
          requestData={{ account_id: '12345', created: '2024-01-15' }}
        />
      </div>
      <div>
        <h3 style={{ marginBottom: '8px' }}>Expired</h3>
        <RequestDetailsCardView
          isInternal={true}
          status="expired"
          requestId="REQ-5"
          displayProps={['account_id', 'created']}
          requestData={{ account_id: '12345', created: '2024-01-15' }}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Comparison view of all request statuses in internal view, showing different status colors and labels.',
      },
    },
  },
};
