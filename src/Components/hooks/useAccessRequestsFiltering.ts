import React from 'react';

interface UseAccessRequestsFilteringProps {
  isInternal: boolean;
  columns: string[];
}

interface UseAccessRequestsFilteringReturn {
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  filterColumn: string;
  setFilterColumn: (column: string) => void;
  isSelectOpen: boolean;
  setIsSelectOpen: (open: boolean) => void;
  statusSelections: string[];
  setStatusSelections: React.Dispatch<React.SetStateAction<string[]>>;
  accountFilter: string;
  setAccountFilter: (filter: string) => void;
  filtersDirty: boolean;
  setFiltersDirty: (dirty: boolean) => void;
  hasFilters: boolean;
  clearFilters: () => void;
  getFilterableColumns: () => number[];
}

export const useAccessRequestsFiltering = ({
  isInternal,
  columns,
}: UseAccessRequestsFilteringProps): UseAccessRequestsFilteringReturn => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState<boolean>(false);
  const [filterColumn, setFilterColumn] = React.useState<string>(
    columns[isInternal ? 1 : 6] // Default to "Account number" for internal, "Decision" for external
  );
  const [isSelectOpen, setIsSelectOpen] = React.useState<boolean>(false);
  const [statusSelections, setStatusSelections] = React.useState<string[]>([]);
  const [accountFilter, setAccountFilter] = React.useState<string>('');
  const [filtersDirty, setFiltersDirty] = React.useState<boolean>(false);

  const hasFilters = React.useMemo(() => {
    return statusSelections.length > 0 || Boolean(accountFilter);
  }, [statusSelections.length, accountFilter]);

  const clearFilters = React.useCallback(() => {
    setStatusSelections([]);
    setAccountFilter('');
    setFiltersDirty(false);
  }, []);

  const getFilterableColumns = React.useCallback(() => {
    // For internal: Account number (1) and Status (6)
    // For external: Decision (6)
    return isInternal ? [1, 6] : [6];
  }, [isInternal]);

  return {
    isDropdownOpen,
    setIsDropdownOpen,
    filterColumn,
    setFilterColumn,
    isSelectOpen,
    setIsSelectOpen,
    statusSelections,
    setStatusSelections,
    accountFilter,
    setAccountFilter,
    filtersDirty,
    setFiltersDirty,
    hasFilters,
    clearFilters,
    getFilterableColumns,
  };
};
