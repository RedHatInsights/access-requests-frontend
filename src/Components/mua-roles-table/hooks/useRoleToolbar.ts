import React, { useReducer } from 'react';

interface RoleRow {
  display_name: string;

  [key: string]: any;
}

interface ToolbarState {
  isDropdownOpen: boolean;
  isSelectOpen: boolean;
  isBulkSelectOpen: boolean;
  filterColumn: string;
}

type ToolbarAction =
  | { type: 'set'; payload: { key: keyof ToolbarState; value: any } }
  | { type: 'reset' };

interface UseRoleToolbarProps {
  setSelectedRoles: (roles: string[]) => void;
  filteredRows: RoleRow[];
  columns: string[];
  appSelections: string[];
  setAppSelections: React.Dispatch<React.SetStateAction<string[]>>;
  nameFilter: string;
}

interface UseRoleToolbarReturn {
  state: ToolbarState;
  setActions: (name: keyof ToolbarState, value: any) => void;
  hasFilters: boolean;
  onSelectAll: (isSelected: boolean) => void;
  handleFilterColumnSelect: (value: string) => void;
  handleAppSelection: (value: string) => void;
  handleToggleDropdown: (isOpen: boolean) => void;
  handleToggleSelect: (isOpen: boolean) => void;
}

export const useRoleToolbar = ({
  setSelectedRoles,
  filteredRows,
  columns,
  appSelections,
  setAppSelections,
  nameFilter,
}: UseRoleToolbarProps): UseRoleToolbarReturn => {
  const initialValue: ToolbarState = {
    isDropdownOpen: false,
    isSelectOpen: false,
    isBulkSelectOpen: false,
    filterColumn: columns[0] || 'Role name',
  };

  const reducer = (
    state: ToolbarState,
    action: ToolbarAction
  ): ToolbarState => {
    switch (action.type) {
      case 'set':
        return {
          ...state,
          [action.payload.key]: action.payload.value,
        };
      case 'reset':
        return initialValue;
      default:
        throw new Error(`Unknown action type: ${(action as any).type}`);
    }
  };

  const [state, dispatch] = useReducer(reducer, initialValue);

  const setActions = React.useCallback(
    (name: keyof ToolbarState, value: any) => {
      dispatch({
        type: 'set',
        payload: { key: name, value },
      });
    },
    []
  );

  const hasFilters = React.useMemo(
    () => appSelections.length > 0 || Boolean(nameFilter),
    [appSelections.length, nameFilter]
  );

  const onSelectAll = React.useCallback(
    (isSelected: boolean) => {
      if (isSelected) {
        setSelectedRoles(filteredRows.map((row) => row.display_name));
      } else {
        setSelectedRoles([]);
      }
    },
    [filteredRows, setSelectedRoles]
  );

  const handleFilterColumnSelect = React.useCallback(
    (value: string) => {
      setActions('isDropdownOpen', false);
      setActions('isSelectOpen', false);
      setActions('filterColumn', value);
    },
    [setActions]
  );

  const handleAppSelection = React.useCallback(
    (value: string) => {
      if (appSelections.includes(value)) {
        setAppSelections((prev) => prev.filter((s) => s !== value));
      } else {
        setAppSelections([...appSelections, value]);
      }
    },
    [appSelections, setAppSelections]
  );

  const handleToggleDropdown = React.useCallback(
    (isOpen: boolean) => {
      setActions('isDropdownOpen', isOpen);
    },
    [setActions]
  );

  const handleToggleSelect = React.useCallback(
    (isOpen: boolean) => {
      setActions('isSelectOpen', isOpen);
    },
    [setActions]
  );

  return {
    state,
    setActions,
    hasFilters,
    onSelectAll,
    handleFilterColumnSelect,
    handleAppSelection,
    handleToggleDropdown,
    handleToggleSelect,
  };
};
