import React, { useState, useEffect } from 'react';
import { FormGroup } from '@patternfly/react-core';
import MUARolesTable from '../mua-roles-table/MUARolesTable';
import { SELECTED_ROLES } from './schema';
import { useFormField } from './hooks/useFormField';

interface SelectRolesProps {
  selectedRoles?: string[]; // Array of role display names
  setSelectedRoles?: (roles: string[]) => void;
  title?: string;
  description?: string;
  name: string; // Required by useFieldApi
}

const SelectRoles: React.FC<SelectRolesProps> = (props) => {
  const { formValues, onChange } = useFormField(props);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    formValues[SELECTED_ROLES] || []
  );

  useEffect(() => {
    onChange(selectedRoles);
  }, [selectedRoles, onChange]);

  return (
    <FormGroup fieldId="select-role">
      <MUARolesTable roles={selectedRoles} setRoles={setSelectedRoles} />
    </FormGroup>
  );
};

export default SelectRoles;
