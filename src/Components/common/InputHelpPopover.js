import React from 'react';
import PropTypes from 'prop-types';
import HelpIcon from '@patternfly/react-icons/dist/esm/icons/help-icon';
import { Popover } from '@patternfly/react-core';

const InputHelpPopover = ({
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
      className="pf-c-form__group-label-help"
    >
      <HelpIcon noVerticalAlign />
    </button>
  </Popover>
);

InputHelpPopover.propTypes = {
  headerContent: PropTypes.element,
  bodyContent: PropTypes.element,
  field: PropTypes.string,
};

export default InputHelpPopover;
