import React from 'react';
import { MUARole } from './useMUATableData';

interface UseMUATableFilteringProps {
  rows: MUARole[];
  selectedRoles: string[];
  isReadOnly: boolean;
}

interface UseMUATableFilteringReturn {
  nameFilter: string;
  setNameFilter: (filter: string) => void;
  appSelections: string[];
  setAppSelections: React.Dispatch<React.SetStateAction<string[]>>;
  filteredRows: MUARole[];
  hasFilters: boolean;
  clearFilters: () => void;
}

export const useMUATableFiltering = ({
  rows,
  selectedRoles,
  isReadOnly,
}: UseMUATableFilteringProps): UseMUATableFilteringReturn => {
  const [nameFilter, setNameFilter] = React.useState<string>('');
  const [appSelections, setAppSelections] = React.useState<string[]>([]);

  const filteredRows = React.useMemo(() => {
    const selectedNames = selectedRoles;

    return rows
      .filter((row) => {
        // Application filter
        if (appSelections.length > 0) {
          return row.applications.some((app) => appSelections.includes(app));
        }
        return true;
      })
      .filter((row) => {
        // Name filter
        if (nameFilter) {
          return row.display_name
            .toLowerCase()
            .includes(nameFilter.toLowerCase());
        }
        return true;
      })
      .filter((row) => {
        // Read-only mode filter - only show selected roles
        if (isReadOnly) {
          return selectedNames.includes(row.display_name);
        }
        return true;
      });
  }, [rows, appSelections, nameFilter, selectedRoles, isReadOnly]);

  const hasFilters = React.useMemo(() => {
    return appSelections.length > 0 || Boolean(nameFilter);
  }, [appSelections.length, nameFilter]);

  const clearFilters = React.useCallback(() => {
    setAppSelections([]);
    setNameFilter('');
  }, []);

  return {
    nameFilter,
    setNameFilter,
    appSelections,
    setAppSelections,
    filteredRows,
    hasFilters,
    clearFilters,
  };
};
