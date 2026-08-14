import type { Meta, StoryObj } from '@storybook/react';
import { CancelRequestModalView } from './CancelRequestModal';

const meta: Meta<typeof CancelRequestModalView> = {
  component: CancelRequestModalView,
  parameters: {
    docs: {
      description: {
        component: `
CancelRequestModalView is the presentational component for canceling access requests. It displays a confirmation modal with danger and cancel buttons, and shows a loading spinner when the cancellation is in progress.

**Key Features:**
- Confirmation dialog with clear messaging
- Danger button styling for destructive action
- Loading state with spinner
- Accessible modal with proper ARIA attributes
        `,
      },
    },
  },
  argTypes: {
    onCancel: { action: 'cancel clicked' },
    onClose: { action: 'modal closed' },
  },
};

export default meta;
type Story = StoryObj<typeof CancelRequestModalView>;

export const Default: Story = {
  args: {
    isLoading: false,
    onCancel: () => console.log('Cancel request action triggered'),
    onClose: (isChanged: boolean) =>
      console.log('Modal closed, changed:', isChanged),
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    onCancel: () => console.log('Cancel request action triggered (loading)'),
    onClose: (isChanged: boolean) =>
      console.log('Modal closed, changed:', isChanged),
  },
};
