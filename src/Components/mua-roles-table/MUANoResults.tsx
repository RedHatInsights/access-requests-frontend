import React from 'react';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { Tbody, Td, Tr } from '@patternfly/react-table';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';
import { FormattedMessage, defineMessages } from 'react-intl';

const messages = defineMessages({
  title: {
    id: 'accessRequests.mua.noResults.title',
    defaultMessage: 'No matching requests found',
  },
  body: {
    id: 'accessRequests.mua.noResults.body',
    defaultMessage:
      'No results match the filter criteria. Remove all filters or clear all filters to show results.',
  },
  clearFilters: {
    id: 'accessRequests.mua.noResults.clearFilters',
    defaultMessage: 'Clear filters',
  },
});

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
            titleText={<FormattedMessage {...messages.title} />}
            variant="sm"
          >
            <EmptyStateBody>
              <FormattedMessage {...messages.body} />
            </EmptyStateBody>
            <EmptyStateFooter>
              <Button variant="link" onClick={onClearFilters}>
                <FormattedMessage {...messages.clearFilters} />
              </Button>
            </EmptyStateFooter>
          </EmptyState>
        </Td>
      </Tr>
    </Tbody>
  );
};

export default MUANoResults;
