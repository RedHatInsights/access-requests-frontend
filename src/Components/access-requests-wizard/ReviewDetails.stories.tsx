import type { Meta, StoryObj } from '@storybook/react';
import { ReviewDetailsDisplay } from './ReviewDetails';

const meta: Meta<typeof ReviewDetailsDisplay> = {
  title: 'Components/Access Requests/ReviewDetailsDisplay',
  component: ReviewDetailsDisplay,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: {
      accountName: 'John Doe',
      accountNumber: '1234567890',
      accessFrom: '01/15/2024',
      accessTo: '02/15/2024',
      selectedRoles: ['Administrator', 'Viewer', 'Editor'],
    },
  },
};

export const SingleRole: Story = {
  args: {
    data: {
      accountName: 'Jane Smith',
      accountNumber: '9876543210',
      accessFrom: '03/01/2024',
      accessTo: '03/31/2024',
      selectedRoles: ['Viewer'],
    },
  },
};

export const NoName: Story = {
  args: {
    data: {
      accountName: '',
      accountNumber: '5555555555',
      accessFrom: '04/01/2024',
      accessTo: '04/30/2024',
      selectedRoles: ['Basic User', 'Guest'],
    },
  },
};

export const ManyRoles: Story = {
  args: {
    data: {
      accountName: 'Bob Johnson',
      accountNumber: '1111222233',
      accessFrom: '05/01/2024',
      accessTo: '06/01/2024',
      selectedRoles: [
        'Administrator',
        'Viewer',
        'Editor',
        'Moderator',
        'Analyst',
        'Developer',
        'Support',
      ],
    },
  },
};
