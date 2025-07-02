import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';

import SetName from './SetName';

// Create the component mapper extension
const mapperExtension = {
  'set-name': SetName,
};

// Simple form template without form controls
const FormTemplate = (props: any) => (
  <Pf4FormTemplate {...props} showFormControls={false} />
);

// SetName component wrapper
const SetNameFormWrapper = ({
  initialValues = {},
  onSubmit = () => {},
}: {
  initialValues?: Record<string, string>;
  onSubmit?: (values: Record<string, string>) => void;
}) => {
  const customComponentMapper = {
    ...componentMapper,
    ...mapperExtension,
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <FormRenderer
        schema={{
          fields: [
            {
              component: 'set-name',
              name: 'set-name-field',
            },
          ],
        }}
        FormTemplate={FormTemplate}
        componentMapper={customComponentMapper}
        initialValues={initialValues}
        onSubmit={onSubmit}
      />
    </div>
  );
};

const meta: Meta<typeof SetNameFormWrapper> = {
  component: SetNameFormWrapper,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
SetName displays the user's first and last name in disabled form fields. This component shows the current user's name information that will be visible to customers as part of the access request.

## Usage
This component is used in the access request wizard to display the user's name information. The fields are disabled because the name comes from the user's authentication profile and cannot be edited within the form.
        `,
      },
    },
  },
  argTypes: {
    onSubmit: { action: 'submitted' },
  },
};

export default meta;
type Story = StoryObj<typeof SetNameFormWrapper>;

export const Default: Story = {
  args: {
    initialValues: {
      'first-name': 'John',
      'last-name': 'Doe',
    },
  },
};

export const EmptyNames: Story = {
  args: {
    initialValues: {
      'first-name': '',
      'last-name': '',
    },
  },
};

export const LongNames: Story = {
  args: {
    initialValues: {
      'first-name': 'Christopher',
      'last-name': 'Vanderbilt-Montgomery',
    },
  },
};
