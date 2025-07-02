import React from 'react';
import HelpIcon from '@patternfly/react-icons/dist/esm/icons/help-icon';
import { Popover } from '@patternfly/react-core';

interface InputHelpPopoverProps {
  headerContent?: React.ReactElement;
  bodyContent?: React.ReactElement;
  field?: string;
}

const InputHelpPopover: React.FC<InputHelpPopoverProps> = ({
  headerContent = null,
  bodyContent = null,
  field = 'input',
}) => (
  <Popover headerContent={headerContent} bodyContent={bodyContent}>
    <button
      type="button"
      aria-label={`More info for ${field}`}
      onClick={(e) => e.preventDefault()}
      aria-describedby="form-name"
      className="pf-v5-c-form__group-label-help"
    >
      <HelpIcon />
    </button>
  </Popover>
);

export default InputHelpPopover;
