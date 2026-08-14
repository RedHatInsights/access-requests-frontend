import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import InputHelpPopover from './InputHelpPopover';

const meta: Meta<typeof InputHelpPopover> = {
  component: InputHelpPopover,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
InputHelpPopover provides contextual help information for form fields. It displays a help icon that shows a popover with helpful text when clicked.

## Usage
This component is typically used alongside form fields to provide additional context or instructions to users.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof InputHelpPopover>;

export const Default: Story = {
  args: {
    bodyContent: <span>This is helpful information about the form field.</span>,
    field: 'username',
  },
};

export const LongContent: Story = {
  args: {
    bodyContent: (
      <span>
        This is a longer help text that provides detailed information about the
        form field. It includes multiple sentences to demonstrate how the
        popover handles longer content. This helps users understand complex
        requirements or provides examples of valid input.
      </span>
    ),
    field: 'description',
  },
};

export const WithHeaderAndBody: Story = {
  args: {
    headerContent: <div>Field Requirements</div>,
    bodyContent: (
      <div>
        <p>
          <strong>Important:</strong> This field is required.
        </p>
        <ul>
          <li>Must be at least 3 characters</li>
          <li>Cannot contain special characters</li>
          <li>Must be unique</li>
        </ul>
      </div>
    ),
    field: 'account-name',
  },
};

export const ShortTip: Story = {
  args: {
    bodyContent: <span>Required field</span>,
    field: 'required-input',
  },
};
