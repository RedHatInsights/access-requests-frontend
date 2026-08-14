import React from 'react';
import { Tbody, Tr, Td } from '@patternfly/react-table';

interface TableSkeletonRowProps {
  /** The table columns to create skeleton cells for */
  columns: string[];
  /** Number of skeleton rows to render */
  rowCount?: number;
  /** Height of skeleton elements in pixels */
  skeletonHeight?: number;
  /** Whether to include a checkbox column (for selectable tables) */
  hasCheckboxColumn?: boolean;
  /** Whether to include an action column */
  hasActionColumn?: boolean;
  /** CSS class for skeleton size */
  skeletonSize?: 'sm' | 'md' | 'lg';
}

/**
 * Pure presentational component for table loading skeleton rows.
 * Creates skeleton placeholders that match table structure during loading states.
 */
export function TableSkeletonRowView({
  columns,
  rowCount = 5,
  skeletonHeight = 22,
  hasCheckboxColumn = false,
  hasActionColumn = false,
  skeletonSize = 'md',
}: TableSkeletonRowProps): React.ReactElement {
  return (
    <React.Fragment>
      {[...Array(rowCount).keys()].map((rowIndex) => (
        <Tbody key={`skeleton-${rowIndex}`}>
          <Tr>
            {hasCheckboxColumn && <Td />}
            {columns.map((col, colIndex) => (
              <Td dataLabel={col} key={colIndex}>
                <div
                  style={{ height: `${skeletonHeight}px` }}
                  className={`ins-c-skeleton ins-c-skeleton__${skeletonSize}`}
                >
                  {' '}
                </div>
              </Td>
            ))}
            {hasActionColumn && <Td />}
          </Tr>
        </Tbody>
      ))}
    </React.Fragment>
  );
}

export default TableSkeletonRowView;
