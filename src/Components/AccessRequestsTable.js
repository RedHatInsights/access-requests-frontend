import React from 'react';
import {
  Toolbar,
  ToolbarItem,
  ToolbarContent,
  Button,
  InputGroup,
  TextInput,
  Pagination,
  Dropdown,
  DropdownToggle,
  DropdownItem,
  Select,
  SelectOption,
  ChipGroup,
  Chip,
  Bullseye,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Title,
} from '@patternfly/react-core';
import {
  TableComposable,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@patternfly/react-table';
import CancelRequestModal from './CancelRequestModal';
import EditRequestModal from './EditRequestModal';
import { capitalize } from '@patternfly/react-core/dist/esm/helpers/util';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';
import FilterIcon from '@patternfly/react-icons/dist/js/icons/filter-icon';
import PlusCircleIcon from '@patternfly/react-icons/dist/js/icons/plus-circle-icon';
import { useDispatch } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/redux';
import { Link, useRouteMatch } from 'react-router-dom';
import { getInternalActions, StatusLabel } from '../Helpers/getActions';
import PropTypes from 'prop-types';
import apiInstance from '../Helpers/apiInstance';

function uncapitalize(input) {
  return input[0].toLowerCase() + input.substring(1);
}

// https://dev.to/gabe_ragland/debouncing-with-react-hooks-jci
function useDebounce(value, delay) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(
    () => {
      // Set debouncedValue to value (passed in) after the specified delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Return a cleanup function that will be called every time ...
      // ... useEffect is re-called. useEffect will only be re-called ...
      // ... if value changes (see the inputs array below).
      // This is how we prevent debouncedValue from changing if value is ...
      // ... changed within the delay period. Timeout gets cleared and restarted.
      // To put it in context, if the user is typing within our app's ...
      // ... search box, we don't want the debouncedValue to update until ...
      // ... they've stopped typing for more than 500ms.
      return () => {
        clearTimeout(handler);
      };
    },
    // Only re-call effect if value changes
    // You could also add the "delay" var to inputs array if you ...
    // ... need to be able to change that dynamically.
    [value]
  );

  return debouncedValue;
}

const statuses = ['pending', 'approved', 'denied', 'cancelled', 'expired'];

const AccessRequestsTable = ({ isInternal }) => {
  const columns = isInternal
    ? [
        'Request ID',
        'Account number',
        'Start date',
        'End date',
        'Created',
        'Status',
      ]
    : [
        'Request ID',
        'First name',
        'Last name',
        'Start date',
        'End date',
        'Created',
        'Decision',
      ];

  // Sorting
  const [activeSortIndex, setActiveSortIndex] = React.useState(
    isInternal ? 4 : 5
  );
  const [activeSortDirection, setActiveSortDirection] = React.useState('desc');
  const onSort = (_ev, index, direction) => {
    setActiveSortIndex(index);
    setActiveSortDirection(direction);
  };

  // Pagination
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(20);
  const AccessRequestsPagination = ({ id }) => (
    <Pagination
      itemCount={numRows}
      perPage={perPage}
      page={page}
      onSetPage={(_ev, pageNumber) => setPage(pageNumber)}
      id={'access-requests-table-pagination-' + id}
      variant={id}
      perPageOptions={[5, 10, 20, 50].map((n) => ({ title: n, value: n }))}
      onPerPageSelect={(_ev, perPage) => {
        setPage(1);
        setPerPage(perPage);
      }}
      isCompact={id === 'top'}
    />
  );

  AccessRequestsPagination.propTypes = {
    id: PropTypes.string,
  };

  // Filtering
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [filterColumn, setFilterColumn] = React.useState(
    columns[isInternal ? 1 : 6]
  );
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);
  const [statusSelections, setStatusSelections] = React.useState([]);

  // Harder than it needs to be to match rest of RBAC which doesn't wait
  // for user to click a button or press enter.
  const [accountFilter, setAccountFilter] = React.useState('');
  const [filtersDirty, setFiltersDirty] = React.useState(false);
  const hasFilters = statusSelections.length > 0 || accountFilter;

  // Row loading
  const [isLoading, setIsLoading] = React.useState(true);
  const [numRows, setNumRows] = React.useState(0);
  const [rows, setRows] = React.useState([]);
  const dispatch = useDispatch();
  const fetchAccessRequests = () => {
    setIsLoading(true);
    const listUrl = new URL(
      `${window.location.origin}${API_BASE}/cross-account-requests/`
    );

    isInternal
      ? listUrl.searchParams.append('query_by', 'user_id')
      : listUrl.searchParams.append('query_by', 'target_org');

    listUrl.searchParams.append('offset', (page - 1) * perPage);
    listUrl.searchParams.append('limit', perPage);
    // https://github.com/RedHatInsights/insights-rbac/blob/master/rbac/api/cross_access/view.py
    if (accountFilter) {
      listUrl.searchParams.append('account', accountFilter);
    }
    if (statusSelections.length > 0) {
      listUrl.searchParams.append('status', statusSelections.join(','));
    }
    const orderBy = `${activeSortDirection === 'desc' ? '-' : ''}${columns[
      activeSortIndex
    ]
      .toLowerCase()
      .replace(' ', '_')}`;
    listUrl.searchParams.append('order_by', orderBy);

    apiInstance
      .get(listUrl.href, { headers: { Accept: 'application/json' } })
      .then((res) => {
        setNumRows(res.meta.count);
        setRows(
          res.data.map((d) =>
            isInternal
              ? [
                  d.request_id,
                  d.target_account,
                  d.start_date,
                  d.end_date,
                  d.created,
                  d.status,
                ]
              : [
                  d.request_id,
                  d.first_name,
                  d.last_name,
                  d.start_date,
                  d.end_date,
                  d.created,
                  d.status,
                ]
          )
        );
        setIsLoading(false);
      })
      .catch((err) => {
        setIsLoading(false);
        dispatch(
          addNotification({
            variant: 'danger',
            title: 'Could not list access requests',
            description: err.message,
          })
        );
      });
  };
  const debouncedAccountFilter = useDebounce(accountFilter, 400);
  React.useEffect(() => {
    fetchAccessRequests();
  }, [
    debouncedAccountFilter,
    statusSelections,
    activeSortIndex,
    activeSortDirection,
    perPage,
    page,
  ]);

  // Modal actions
  const [openModal, setOpenModal] = React.useState({ type: null });
  const onModalClose = (isChanged) => {
    setOpenModal({ type: null });
    if (isChanged) {
      fetchAccessRequests();
    }
  };
  const modals = (
    <React.Fragment>
      {openModal.type === 'cancel' && (
        <CancelRequestModal
          requestId={openModal.requestId}
          onClose={onModalClose}
        />
      )}
      {['edit', 'create'].includes(openModal.type) && (
        <EditRequestModal
          variant={openModal.type}
          requestId={openModal.requestId}
          onClose={onModalClose}
        />
      )}
    </React.Fragment>
  );

  // Rendering
  const createButton = isInternal && (
    <Button variant="primary" onClick={() => setOpenModal({ type: 'create' })}>
      Create request
    </Button>
  );
  if (rows.length === 0 && !isLoading && !filtersDirty) {
    return (
      <Bullseye style={{ height: 'auto' }} className="pf-u-mt-lg">
        <EmptyState variant="large">
          <EmptyStateIcon icon={PlusCircleIcon} />
          <Title headingLevel="h3" size="lg">
            {isInternal ? 'No access requests' : 'You have no access requests'}
          </Title>
          <EmptyStateBody>
            {isInternal
              ? 'Click the button below to create an access request.'
              : 'You have no pending Red Hat access requests.'}
          </EmptyStateBody>
          {createButton}
        </EmptyState>
        {modals}
      </Bullseye>
    );
  }

  const selectLabelId = 'filter-status';
  const selectPlaceholder = `Filter by ${uncapitalize(
    columns[columns.length - 1]
  )}`;
  const clearFiltersButton = (
    <Button
      variant="link"
      onClick={() => {
        setStatusSelections([]);
        setAccountFilter('');
        setPage(1);
      }}
    >
      Clear filters
    </Button>
  );
  const toolbar = (
    <Toolbar id="access-requests-table-toolbar">
      <ToolbarContent>
        <ToolbarItem>
          <InputGroup>
            <Dropdown
              isOpen={isDropdownOpen}
              onSelect={(ev) => {
                setIsDropdownOpen(false);
                setFilterColumn(ev.target.value);
                setIsSelectOpen(false);
                setFiltersDirty(true);
              }}
              toggle={
                <DropdownToggle
                  onToggle={(isOpen) => setIsDropdownOpen(isOpen)}
                >
                  <FilterIcon /> {filterColumn}
                </DropdownToggle>
              }
              // https://marvelapp.com/prototype/257je526/screen/74764732
              dropdownItems={(isInternal ? [1, 5] : [6])
                .map((i) => columns[i])
                .map((colName) => (
                  // Filterable columns are RequestID, AccountID, and Status
                  <DropdownItem
                    key={colName}
                    value={colName}
                    component="button"
                  >
                    {capitalize(colName)}
                  </DropdownItem>
                ))}
            />
            {['Status', 'Decision'].includes(filterColumn) && (
              <React.Fragment>
                <span id={selectLabelId} hidden>
                  {selectPlaceholder}
                </span>
                <Select
                  aria-labelledby={selectLabelId}
                  variant="checkbox"
                  aria-label="Select statuses"
                  onToggle={(isOpen) => setIsSelectOpen(isOpen)}
                  onSelect={(_ev, selection) => {
                    setFiltersDirty(true);
                    if (statusSelections.includes(selection)) {
                      setStatusSelections(
                        statusSelections.filter((s) => s !== selection)
                      );
                    } else {
                      setStatusSelections([...statusSelections, selection]);
                    }
                    setPage(1);
                  }}
                  isOpen={isSelectOpen}
                  selections={Array.from(statusSelections)}
                  isCheckboxSelectionBadgeHidden
                  placeholderText={selectPlaceholder}
                >
                  {statuses.map((status) => (
                    <SelectOption key={status} value={status}>
                      {capitalize(status)}
                    </SelectOption>
                  ))}
                </Select>
              </React.Fragment>
            )}
            {filterColumn === 'Account number' && (
              <form
                style={{ display: 'flex' }}
                onSubmit={(ev) => ev.preventDefault()}
              >
                <TextInput
                  name={`${filterColumn}-filter`}
                  id={`${filterColumn}-filter`}
                  type="search"
                  iconVariant="search"
                  placeholder={`Filter by ${uncapitalize(filterColumn)}`}
                  aria-label={`${filterColumn} search input`}
                  value={accountFilter}
                  onChange={(val) => {
                    setAccountFilter(val), setFiltersDirty(true), setPage(1);
                  }}
                />
              </form>
            )}
          </InputGroup>
        </ToolbarItem>
        <ToolbarItem>{createButton}</ToolbarItem>
        <ToolbarItem variant="pagination" align={{ default: 'alignRight' }}>
          <AccessRequestsPagination id="top" />
        </ToolbarItem>
      </ToolbarContent>
      <ToolbarContent>
        <ChipGroup categoryName="Status">
          {statusSelections.map((status) => (
            <Chip
              key={status}
              onClick={() => {
                setStatusSelections(
                  statusSelections.filter((s) => s !== status)
                );
                setPage(1);
              }}
            >
              {status}
            </Chip>
          ))}
        </ChipGroup>
        {accountFilter && (
          <ChipGroup categoryName="Account number">
            <Chip
              onClick={() => {
                setAccountFilter(''), setPage(1);
              }}
            >
              {accountFilter}
            </Chip>
          </ChipGroup>
        )}
        {hasFilters && clearFiltersButton}
      </ToolbarContent>
    </Toolbar>
  );
  function getColumnWidth(columnIndex) {
    if (isInternal) {
      return columnIndex === 0 ? 30 : 15;
    }

    return [0, 6].includes(columnIndex) ? 20 : 10;
  }
  const { url } = useRouteMatch();
  const table = (
    <TableComposable aria-label="Access requests table" variant="compact">
      <Thead>
        <Tr>
          {columns.map((column, columnIndex) => (
            <Th
              key={columnIndex}
              {...(!column.includes('name') &&
                column !== 'Decision' && {
                  sort: {
                    sortBy: {
                      index: activeSortIndex,
                      direction: activeSortDirection,
                    },
                    onSort,
                    columnIndex,
                  },
                })}
              width={getColumnWidth(columnIndex)}
            >
              {column}
            </Th>
          ))}
          {isInternal && <Th />}
        </Tr>
      </Thead>
      <Tbody>
        {isLoading
          ? [...Array(rows.length || perPage).keys()].map((i) => (
              <Tr key={i}>
                {columns.map((name, j) => (
                  <Td key={j} dataLabel={name}>
                    <div
                      style={{ height: '30px' }}
                      className="ins-c-skeleton ins-c-skeleton__md"
                    >
                      {' '}
                    </div>
                  </Td>
                ))}
              </Tr>
            ))
          : rows.map((row, rowIndex) => (
              <Tr key={rowIndex}>
                <Td dataLabel={columns[0]}>
                  <Link to={`${url}${url.endsWith('/') ? '' : '/'}${row[0]}`}>
                    {row[0]}
                  </Link>
                </Td>
                <Td dataLabel={columns[1]}>{row[1]}</Td>
                <Td dataLabel={columns[2]}>{row[2]}</Td>
                <Td dataLabel={columns[3]}>{row[3]}</Td>
                <Td dataLabel={columns[4]}>{row[4]}</Td>
                {isInternal ? (
                  <Td dataLabel={columns[5]}>
                    <StatusLabel
                      requestId={row[0]}
                      status={row[5]}
                      onLabelClick={() => {
                        setStatusSelections([
                          ...statusSelections.filter((s) => s !== status),
                          status,
                        ]);
                        setPage(1);
                      }}
                      hideActions
                    />
                  </Td>
                ) : (
                  <Td dataLabel={columns[5]}>{row[5]}</Td>
                )}
                {isInternal ? (
                  // Different actions based on status
                  <Td
                    actions={getInternalActions(row[5], row[0], setOpenModal)}
                  />
                ) : (
                  <Td dataLabel={columns[6]}>
                    <StatusLabel requestId={row[0]} status={row[6]} />
                  </Td>
                )}
              </Tr>
            ))}
        {rows.length === 0 && hasFilters && (
          <Tr>
            <Td colSpan={columns.length}>
              <EmptyState variant="small">
                <EmptyStateIcon icon={SearchIcon} />
                <Title headingLevel="h2" size="lg">
                  No matching requests found
                </Title>
                <EmptyStateBody>
                  No results match the filter criteria. Remove all filters or
                  clear all filters to show results.
                </EmptyStateBody>
                {clearFiltersButton}
              </EmptyState>
            </Td>
          </Tr>
        )}
      </Tbody>
    </TableComposable>
  );

  return (
    <React.Fragment>
      {toolbar}
      {table}
      <AccessRequestsPagination id="bottom" />
      {modals}
    </React.Fragment>
  );
};

AccessRequestsTable.propTypes = {
  isInternal: PropTypes.bool,
};

export default AccessRequestsTable;
