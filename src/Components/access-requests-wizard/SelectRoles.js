import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { FormGroup } from '@patternfly/react-core';
import MUARolesTable from '../MUARolesTable';
import { SELECTED_ROLES } from './schema';

const SelectRoles = (props) => {
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();
  const values = formOptions.getState().values;
  const [selectedRoles, setSelectedRoles] = useState(
    values[SELECTED_ROLES] || []
  );

  useEffect(() => {
    input.onChange(selectedRoles);
  }, [selectedRoles]);

  return (
    <FormGroup fieldId="select-role">
      <MUARolesTable roles={selectedRoles} setRoles={setSelectedRoles} />
    </FormGroup>
  );
};

SelectRoles.propTypes = {
  selectedRoles: PropTypes.array,
  setSelectedRoles: PropTypes.func,
  title: PropTypes.string,
  description: PropTypes.string,
};

export default SelectRoles;
