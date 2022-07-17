import React from 'react';
import { FormGroup, Split, SplitItem, TextInput } from '@patternfly/react-core';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import InputHelpPopover from '../common/InputHelpPopover';

const SetName = () => {
  const { getState } = useFormApi();
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
            value={getState().values['first-name']}
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
            value={getState().values['last-name']}
            isDisabled
          />
        </FormGroup>
      </SplitItem>
    </Split>
  );
};

export default SetName;
