import React from 'react';
import { MUARole } from './useMUATableData';

export type SortDirection = 'asc' | 'desc';
export type SortableField = 'name' | 'description' | 'permissions';

interface UseMUATableSortingProps {
  rows: MUARole[];
}

interface UseMUATableSortingReturn {
  activeSortIndex: number;
  activeSortDirection: SortDirection;
  sortedRows: MUARole[];
  onSort: (event: any, index: number, direction: SortDirection) => void;
}

// Map column indices to field names
const COLUMN_INDEX_MAP: { [key: number]: SortableField } = {
  0: 'name',
  1: 'description',
  2: 'permissions',
};

export const useMUATableSorting = ({
  rows,
}: UseMUATableSortingProps): UseMUATableSortingReturn => {
  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(0); // Default to first column
  const [activeSortDirection, setActiveSortDirection] =
    React.useState<SortDirection>('asc');

  const onSort = React.useCallback(
    (_event: any, index: number, direction: SortDirection) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
    },
    []
  );

  const sortedRows = React.useMemo(() => {
    return [...rows].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      // Map sort index to actual field names
      const fieldName = COLUMN_INDEX_MAP[activeSortIndex] || 'name';
      switch (fieldName) {
        case 'name':
          aValue = a.display_name;
          bValue = b.display_name;
          break;
        case 'description':
          aValue = a.description;
          bValue = b.description;
          break;
        case 'permissions':
          aValue = a.permissions;
          bValue = b.permissions;
          break;
        default:
          aValue = a.display_name;
          bValue = b.display_name;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        // Numeric sort
        if (activeSortDirection === 'asc') {
          return aValue - bValue;
        }
        return bValue - aValue;
      } else {
        // String sort
        const aStr = String(aValue || '');
        const bStr = String(bValue || '');

        if (activeSortDirection === 'asc') {
          return aStr.localeCompare(bStr);
        }
        return bStr.localeCompare(aStr);
      }
    });
  }, [rows, activeSortIndex, activeSortDirection]);

  return {
    activeSortIndex,
    activeSortDirection,
    sortedRows,
    onSort,
  };
};
