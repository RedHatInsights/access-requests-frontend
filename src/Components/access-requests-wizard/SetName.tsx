import React from 'react';
import { FormGroup, Split, SplitItem, TextInput } from '@patternfly/react-core';
import InputHelpPopover from '../common/InputHelpPopover';
import { useFormField } from './hooks/useFormField';

interface SetNameProps {
  name: string; // Required by useFieldApi
}

const SetName: React.FC<SetNameProps> = (props) => {
  const { formValues } = useFormField(props);

  const popoverBody = (
    <p>
      Customers will be able to see this information as part of your request
    </p>
  );

  return (
    <Split hasGutter>
      <SplitItem isFilled>
        <FormGroup
          label="First name"
          name="first-name"
          labelIcon={
            <InputHelpPopover bodyContent={popoverBody} field="first name" />
          }
        >
          <TextInput
            id="first-name"
            value={formValues['first-name'] || ''}
            isDisabled
          />
        </FormGroup>
      </SplitItem>
      <SplitItem isFilled>
        <FormGroup
          label="Last name"
          name="last-name"
          labelIcon={
            <InputHelpPopover bodyContent={popoverBody} field="last name" />
          }
        >
          <TextInput
            id="last-name"
            value={formValues['last-name'] || ''}
            isDisabled
          />
        </FormGroup>
      </SplitItem>
    </Split>
  );
};

export default SetName;
