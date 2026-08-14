import React from 'react';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { Tbody, Td, Tr } from '@patternfly/react-table';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';

interface MUANoResultsProps {
  columns: Array<any>; // Table column configuration
  onClearFilters: () => void;
}

const MUANoResults: React.FC<MUANoResultsProps> = ({
  columns,
  onClearFilters,
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
            <EmptyStateFooter>
              <Button variant="link" onClick={onClearFilters}>
                Clear filters
              </Button>
            </EmptyStateFooter>
          </EmptyState>
        </Td>
      </Tr>
    </Tbody>
  );
};

export default MUANoResults;
