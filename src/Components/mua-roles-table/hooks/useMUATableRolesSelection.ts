import React from 'react';
import { MUARole } from './useMUATableRolesData';

interface UseMUATableRolesSelectionProps {
  selectedRoles: string[];
  setSelectedRoles: (roles: string[]) => void;
  sortedRows: MUARole[];
}

interface UseMUATableRolesSelectionReturn {
  anySelected: boolean;
  someChecked: boolean | null;
  isChecked: boolean | null;
  onSelect: (event: any, isSelected: boolean, rowId: number) => void;
  getIsRowSelected: (rowName: string) => boolean;
}

export const useMUATableRolesSelection = ({
  selectedRoles,
  setSelectedRoles,
  sortedRows,
}: UseMUATableRolesSelectionProps): UseMUATableRolesSelectionReturn => {
  const anySelected = React.useMemo(() => {
    return selectedRoles.length > 0;
  }, [selectedRoles.length]);

  const someChecked = React.useMemo(() => {
    return anySelected ? null : false;
  }, [anySelected]);

  const isChecked = React.useMemo(() => {
    return selectedRoles.length === sortedRows.length &&
      selectedRoles.length > 0
      ? true
      : someChecked;
  }, [selectedRoles.length, sortedRows.length, someChecked]);

  const onSelect = React.useCallback(
    (_event: any, isSelectedState: boolean, rowId: number) => {
      // Get the role name from the current page of data
      const roleName = sortedRows[rowId]?.display_name;
      console.log({ rowId, selectedRoles, filteredRows: sortedRows });

      if (!roleName) {
        return;
      }

      if (isSelectedState) {
        // Add role to selection if not already selected
        if (!selectedRoles.includes(roleName)) {
          setSelectedRoles([...selectedRoles, roleName]);
        }
      } else {
        // Remove role from selection
        setSelectedRoles(selectedRoles.filter((role) => role !== roleName));
      }
    },
    [selectedRoles, setSelectedRoles, sortedRows]
  );

  const getIsRowSelected = React.useCallback(
    (rowName: string) => {
      return selectedRoles.includes(rowName);
    },
    [selectedRoles]
  );

  return {
    anySelected,
    someChecked,
    isChecked,
    onSelect,
    getIsRowSelected,
  };
};
