import React from 'react';
import { FormGroup, Split, SplitItem, TextInput } from '@patternfly/react-core';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import InputHelpPopover from '../common/InputHelpPopover';
import { useFormField } from './hooks/useFormField';

const messages = defineMessages({
  firstName: {
    id: 'accessRequests.wizard.setName.firstName',
    defaultMessage: 'First name',
  },
  lastName: {
    id: 'accessRequests.wizard.setName.lastName',
    defaultMessage: 'Last name',
  },
  popoverBody: {
    id: 'accessRequests.wizard.setName.popoverBody',
    defaultMessage:
      'Customers will be able to see this information as part of your request',
  },
  popoverFieldFirst: {
    id: 'accessRequests.wizard.setName.popoverFieldFirst',
    defaultMessage: 'first name',
  },
  popoverFieldLast: {
    id: 'accessRequests.wizard.setName.popoverFieldLast',
    defaultMessage: 'last name',
  },
});

interface SetNameProps {
  name: string; // Required by useFieldApi
}

const SetName: React.FC<SetNameProps> = (props) => {
  const intl = useIntl();
  const { formValues } = useFormField(props);

  const popoverBody = (
    <p>
      <FormattedMessage {...messages.popoverBody} />
    </p>
  );

  return (
    <Split hasGutter>
      <SplitItem isFilled>
        <FormGroup
          label={<FormattedMessage {...messages.firstName} />}
          name="first-name"
          labelHelp={
            <InputHelpPopover
              bodyContent={popoverBody}
              field={intl.formatMessage(messages.popoverFieldFirst)}
            />
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
          label={<FormattedMessage {...messages.lastName} />}
          name="last-name"
          labelHelp={
            <InputHelpPopover
              bodyContent={popoverBody}
              field={intl.formatMessage(messages.popoverFieldLast)}
            />
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
