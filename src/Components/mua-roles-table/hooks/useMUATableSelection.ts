import React from 'react';
import { MUARole } from './useMUATableData';

interface UseMUATableSelectionProps {
  selectedRoles: string[];
  setSelectedRoles: (roles: string[]) => void;
  filteredRows: MUARole[];
}

interface UseMUATableSelectionReturn {
  anySelected: boolean;
  someChecked: boolean | null;
  isChecked: boolean | null;
  onSelect: (event: any, isSelected: boolean, rowId: number) => void;
  getIsRowSelected: (rowName: string) => boolean;
}

export const useMUATableSelection = ({
  selectedRoles,
  setSelectedRoles,
  filteredRows,
}: UseMUATableSelectionProps): UseMUATableSelectionReturn => {
  const anySelected = React.useMemo(() => {
    return selectedRoles.length > 0;
  }, [selectedRoles.length]);

  const someChecked = React.useMemo(() => {
    return anySelected ? null : false;
  }, [anySelected]);

  const isChecked = React.useMemo(() => {
    return selectedRoles.length === filteredRows.length &&
      selectedRoles.length > 0
      ? true
      : someChecked;
  }, [selectedRoles.length, filteredRows.length, someChecked]);

  const onSelect = React.useCallback(
    (_event: any, isSelectedState: boolean, rowId: number) => {
      // Get the role name from the current page of data
      const roleName = filteredRows[rowId]?.display_name;

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
    [selectedRoles, setSelectedRoles, filteredRows]
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
