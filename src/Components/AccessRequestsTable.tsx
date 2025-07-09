import React from 'react';
import {
  Label,
  LabelGroup,
  Bullseye,
  Button,
  capitalize,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  InputGroup,
  InputGroupItem,
  Pagination,
  TextInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
} from '@patternfly/react-core';
import { Tbody, Td, Th, Thead, Tr, Table } from '@patternfly/react-table';
import CancelRequestModal from './CancelRequestModal';
import AccessRequestsWizard from './access-requests-wizard/AccessRequestsWizard';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';
import FilterIcon from '@patternfly/react-icons/dist/js/icons/filter-icon';
import PlusCircleIcon from '@patternfly/react-icons/dist/js/icons/plus-circle-icon';
import { Link } from 'react-router-dom';
import { StatusLabel } from '../Helpers/getActions';
import { useAccessRequestsData } from './hooks/useAccessRequestsData';
import { useAccessRequestsFiltering } from './hooks/useAccessRequestsFiltering';
import { useDebounce } from './hooks/useDebounce';

interface AccessRequestsPaginationViewProps {
  /** Total number of items */
  itemCount: number;
  /** Number of items per page */
  perPage: number;
  /** Current page number */
  page: number;
  /** Callback when page is changed */
  onSetPage: (page: number) => void;
  /** Callback when items per page is changed */
  onPerPageSelect: (perPage: number) => void;
  /** Unique identifier for the pagination instance */
  id: string;
  /** Whether to show compact pagination controls */
  isCompact: boolean;
}

/**
 * Pure presentational component for access requests table pagination.
 * Provides standard pagination controls with configurable per-page options.
 */
export function AccessRequestsPaginationView({
  itemCount,
  perPage,
  page,
  onSetPage,
  onPerPageSelect,
  id,
  isCompact,
}: AccessRequestsPaginationViewProps): React.ReactElement {
  return (
    <Pagination
      itemCount={itemCount}
      perPage={perPage}
      page={page}
      onSetPage={(_event, pageNumber) => onSetPage(pageNumber)}
      id={`access-requests-table-pagination-${id}`}
      variant={id as any}
      perPageOptions={[5, 10, 20, 50].map((n) => ({
        title: String(n),
        value: n,
      }))}
      onPerPageSelect={(_event, newPerPage) => onPerPageSelect(newPerPage)}
      isCompact={isCompact}
    />
  );
}

const uncapitalize = (input: string): string =>
  input[0].toLowerCase() + input.substring(1);

const statuses = ['pending', 'approved', 'denied', 'cancelled', 'expired'];

interface ModalState {
  type: 'create' | 'edit' | 'cancel' | null;
  requestId?: string;
}

interface AccessRequestsTableProps {
  isInternal: boolean;
}

const AccessRequestsTable: React.FC<AccessRequestsTableProps> = ({
  isInternal,
}) => {
  // Column definitions based on view type
  const columns = React.useMemo(
    () =>
      isInternal
        ? [
            'Request ID',
            'Account number',
            'Account name',
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
          ],
    [isInternal]
  );

  // Sorting state
  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(
    isInternal ? 4 : 5 // Default sort by "End date" or "Created"
  );
  const [activeSortDirection, setActiveSortDirection] = React.useState<
    'asc' | 'desc'
  >('desc');

  const onSort = React.useCallback(
    (_event: any, index: number, direction: 'asc' | 'desc') => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
    },
    []
  );

  // Pagination state
  const [page, setPage] = React.useState<number>(1);
  const [perPage, setPerPage] = React.useState<number>(20);

  // Filtering logic
  const filtering = useAccessRequestsFiltering({ isInternal, columns });
  const debouncedAccountFilter = useDebounce(filtering.accountFilter, 400);

  // Data fetching
  const { isLoading, numRows, rows, fetchAccessRequests } =
    useAccessRequestsData({
      isInternal,
      page,
      perPage,
      activeSortIndex,
      activeSortDirection,
      accountFilter: debouncedAccountFilter,
      statusSelections: filtering.statusSelections,
      columns,
    });

  // Fetch data when dependencies change
  React.useEffect(() => {
    fetchAccessRequests();
  }, [fetchAccessRequests]);

  // Modal state
  const [openModal, setOpenModal] = React.useState<ModalState>({ type: null });

  const onModalClose = React.useCallback(
    (isChanged: boolean) => {
      setOpenModal({ type: null });
      if (isChanged) {
        fetchAccessRequests();
      }
    },
    [fetchAccessRequests]
  );

  // Create button for internal users
  const createButton = isInternal && (
    <Button variant="primary" onClick={() => setOpenModal({ type: 'create' })}>
      Create request
    </Button>
  );

  // Early return for empty state when no data and no filters
  if (rows.length === 0 && !isLoading && !filtering.filtersDirty) {
    return (
      <Bullseye style={{ height: 'auto' }} className="pf-v6-u-mt-lg">
        <EmptyState
          headingLevel="h3"
          icon={PlusCircleIcon}
          titleText={
            isInternal ? 'No access requests' : 'You have no access requests'
          }
          variant="lg"
        >
          <EmptyStateBody>
            {isInternal
              ? 'Click the button below to create an access request.'
              : 'You have no pending Red Hat access requests.'}
          </EmptyStateBody>
          <EmptyStateFooter>{createButton}</EmptyStateFooter>
        </EmptyState>
        {/* Render modals */}
        <React.Fragment>
          {openModal.type === 'cancel' && (
            <CancelRequestModal
              requestId={openModal.requestId!}
              onClose={onModalClose}
            />
          )}
          {['edit', 'create'].includes(openModal.type!) && (
            <AccessRequestsWizard
              variant={openModal.type as 'create' | 'edit'}
              requestId={openModal.requestId}
              onClose={onModalClose}
            />
          )}
        </React.Fragment>
      </Bullseye>
    );
  }

  // Clear filters button
  const clearFiltersButton = (
    <Button
      variant="link"
      onClick={() => {
        filtering.clearFilters();
        setPage(1);
      }}
    >
      Clear filters
    </Button>
  );

  // Filter labels and placeholders
  const selectLabelId = 'filter-status';
  const selectPlaceholder = `Filter by ${uncapitalize(
    columns[columns.length - 1]
  )}`;

  // Toolbar with filtering
  const toolbar = (
    <Toolbar id="access-requests-table-toolbar">
      <ToolbarContent>
        <ToolbarItem>
          <InputGroup>
            <InputGroupItem>
              <Dropdown
                isOpen={filtering.isDropdownOpen}
                onSelect={(
                  event?: React.MouseEvent<Element, MouseEvent>,
                  value?: string | number
                ) => {
                  if (value) {
                    filtering.setIsDropdownOpen(false);
                    filtering.setFilterColumn(value.toString());
                    filtering.setIsSelectOpen(false);
                    filtering.setFiltersDirty(true);
                  }
                }}
                onOpenChange={(isOpen: boolean) =>
                  filtering.setIsDropdownOpen(isOpen)
                }
                toggle={(toggleRef: React.Ref<any>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() =>
                      filtering.setIsDropdownOpen(!filtering.isDropdownOpen)
                    }
                    isExpanded={filtering.isDropdownOpen}
                    icon={<FilterIcon />}
                  >
                    {filtering.filterColumn}
                  </MenuToggle>
                )}
              >
                <DropdownList>
                  {filtering
                    .getFilterableColumns()
                    .map((i) => columns[i])
                    .map((colName) => (
                      <DropdownItem key={colName} value={colName}>
                        {capitalize(colName)}
                      </DropdownItem>
                    ))}
                </DropdownList>
              </Dropdown>
            </InputGroupItem>

            {/* Status/Decision filter */}
            {['Status', 'Decision'].includes(filtering.filterColumn) && (
              <React.Fragment>
                <span id={selectLabelId} hidden>
                  {selectPlaceholder}
                </span>
                <Select
                  aria-labelledby={selectLabelId}
                  aria-label="Select statuses"
                  isOpen={filtering.isSelectOpen}
                  selected={filtering.statusSelections}
                  onSelect={(
                    event?: React.MouseEvent<Element, MouseEvent>,
                    value?: string | number
                  ) => {
                    if (value) {
                      filtering.setFiltersDirty(true);
                      const selectionStr = value.toString();
                      if (filtering.statusSelections.includes(selectionStr)) {
                        filtering.setStatusSelections(
                          filtering.statusSelections.filter(
                            (s) => s !== selectionStr
                          )
                        );
                      } else {
                        filtering.setStatusSelections([
                          ...filtering.statusSelections,
                          selectionStr,
                        ]);
                      }
                      setPage(1);
                    }
                  }}
                  onOpenChange={(isOpen: boolean) =>
                    filtering.setIsSelectOpen(isOpen)
                  }
                  toggle={(toggleRef: React.Ref<any>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() =>
                        filtering.setIsSelectOpen(!filtering.isSelectOpen)
                      }
                      isExpanded={filtering.isSelectOpen}
                    >
                      {filtering.statusSelections.length > 0
                        ? `${filtering.statusSelections.length} selected`
                        : selectPlaceholder}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {statuses.map((status) => (
                      <SelectOption
                        key={status}
                        value={status}
                        hasCheckbox
                        isSelected={filtering.statusSelections.includes(status)}
                      >
                        {capitalize(status)}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </React.Fragment>
            )}

            {/* Account number filter */}
            {filtering.filterColumn === 'Account number' && (
              <form
                style={{ display: 'flex' }}
                onSubmit={(event) => event.preventDefault()}
              >
                <TextInput
                  name={`${filtering.filterColumn}-filter`}
                  id={`${filtering.filterColumn}-filter`}
                  type="search"
                  placeholder={`Filter by ${uncapitalize(
                    filtering.filterColumn
                  )}`}
                  aria-label={`${filtering.filterColumn} search input`}
                  value={filtering.accountFilter}
                  onChange={(_event, val) => {
                    filtering.setAccountFilter(val);
                    filtering.setFiltersDirty(true);
                    setPage(1);
                  }}
                />
              </form>
            )}
          </InputGroup>
        </ToolbarItem>
        <ToolbarItem>{createButton}</ToolbarItem>
        <ToolbarItem variant="pagination" align={{ default: 'alignEnd' }}>
          <AccessRequestsPaginationView
            itemCount={numRows}
            perPage={perPage}
            page={page}
            onSetPage={setPage}
            onPerPageSelect={(newPerPage: number) => {
              setPage(1);
              setPerPage(newPerPage);
            }}
            id={'top'}
            isCompact={true}
          />
        </ToolbarItem>
      </ToolbarContent>

      {/* Filter chips */}
      <ToolbarContent>
        <LabelGroup categoryName="Status">
          {filtering.statusSelections.map((status) => (
            <Label
              variant="outline"
              key={status}
              onClose={() => {
                filtering.setStatusSelections(
                  filtering.statusSelections.filter((s) => s !== status)
                );
                setPage(1);
              }}
            >
              {status}
            </Label>
          ))}
        </LabelGroup>
        {filtering.accountFilter && (
          <LabelGroup categoryName="Account number">
            <Label
              variant="outline"
              onClose={() => {
                filtering.setAccountFilter('');
                setPage(1);
              }}
            >
              {filtering.accountFilter}
            </Label>
          </LabelGroup>
        )}
        {filtering.hasFilters && clearFiltersButton}
      </ToolbarContent>
    </Toolbar>
  );

  // Column width calculation
  const getColumnWidth = (columnIndex: number): 10 | 15 | 20 | 30 => {
    if (isInternal) {
      return columnIndex === 0 ? 30 : 15;
    }
    return [0, 6].includes(columnIndex) ? 20 : 10;
  };

  // Main data table
  const table = (
    <Table aria-label="Access requests table" variant="compact">
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
        {/* Loading skeleton rows */}
        {isLoading &&
          [...Array(rows.length || perPage).keys()].map((i) => (
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
          ))}

        {/* Data rows */}
        {!isLoading &&
          rows.map((row, rowIndex) => (
            <Tr key={rowIndex}>
              <Td dataLabel={columns[0]}>
                <Link to={row[0]}>{row[0]}</Link>
              </Td>
              <Td dataLabel={columns[1]}>{row[1]}</Td>
              <Td dataLabel={columns[2]}>{row[2]}</Td>
              <Td dataLabel={columns[3]}>{row[3]}</Td>
              <Td dataLabel={columns[4]}>{row[4]}</Td>
              {isInternal ? (
                <Td dataLabel={columns[5]}>
                  <StatusLabel
                    requestId={row[0]}
                    status={row[5] as any}
                    hideActions
                  />
                </Td>
              ) : (
                <Td dataLabel={columns[5]}>{row[5]}</Td>
              )}
              {isInternal ? (
                <Td dataLabel={columns[6]}>
                  <StatusLabel
                    requestId={row[0]}
                    status={row[6] as any}
                    hideActions
                  />
                </Td>
              ) : (
                <Td dataLabel={columns[6]}>
                  <StatusLabel requestId={row[0]} status={row[6] as any} />
                </Td>
              )}
            </Tr>
          ))}

        {/* No results empty state */}
        {rows.length === 0 && filtering.hasFilters && !isLoading && (
          <Tr>
            <Td colSpan={columns.length + (isInternal ? 1 : 0)}>
              <div>
                <EmptyState
                  headingLevel="h2"
                  icon={SearchIcon}
                  titleText="No matching requests found"
                  variant="sm"
                >
                  <EmptyStateBody>
                    No results match the filter criteria. Remove all filters or
                    clear all filters to show results.
                  </EmptyStateBody>
                  <EmptyStateFooter>{clearFiltersButton}</EmptyStateFooter>
                </EmptyState>
              </div>
            </Td>
          </Tr>
        )}
      </Tbody>
    </Table>
  );

  // Render modals
  const modals = (
    <React.Fragment>
      {openModal.type === 'cancel' && (
        <CancelRequestModal
          requestId={openModal.requestId!}
          onClose={onModalClose}
        />
      )}
      {['edit', 'create'].includes(openModal.type!) && (
        <AccessRequestsWizard
          variant={openModal.type as 'create' | 'edit'}
          requestId={openModal.requestId}
          onClose={onModalClose}
        />
      )}
    </React.Fragment>
  );

  return (
    <React.Fragment>
      {toolbar}
      {table}
      <AccessRequestsPaginationView
        itemCount={numRows}
        perPage={perPage}
        page={page}
        onSetPage={setPage}
        onPerPageSelect={(newPerPage: number) => {
          setPage(1);
          setPerPage(newPerPage);
        }}
        id={'bottom'}
        isCompact={false}
      />
      {modals}
    </React.Fragment>
  );
};

export default AccessRequestsTable;
