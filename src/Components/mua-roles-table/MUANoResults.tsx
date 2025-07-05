import React from 'react';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { Tbody, Tr, Td } from '@patternfly/react-table';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';

interface MUANoResultsProps {
  columns: Array<any>; // Table column configuration
  clearFiltersButton: React.ReactElement;
}

const MUANoResults: React.FC<MUANoResultsProps> = ({
  columns,
  clearFiltersButton,
}) => {
  return (
    <Tbody>
      <Tr>
        <Td colSpan={columns.length}>
          <EmptyState
            headingLevel="h2"
            icon={SearchIcon}
            titleText="No matching requests found"
            variant="sm"
          >
            <EmptyStateBody>
              No results match the filter criteria. Remove all filters or clear
              all filters to show results.
            </EmptyStateBody>
            <EmptyStateFooter>{clearFiltersButton}</EmptyStateFooter>
          </EmptyState>
        </Td>
      </Tr>
    </Tbody>
  );
};

export default MUANoResults;
