import React from 'react';
import { Title, Button, Pagination, Tooltip } from '@patternfly/react-core';
import {
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableVariant,
} from '@patternfly/react-table';
import { Table } from '@patternfly/react-table/deprecated';
import { css } from '@patternfly/react-styles';
import RoleToolbar from './RoleToolbar';
import MUANoResults from './MUANoResults';
import { useMUATableData } from './hooks/useMUATableData';
import { useMUATableSorting } from './hooks/useMUATableSorting';
import { useMUATableFiltering } from './hooks/useMUATableFiltering';
import { useMUATablePagination } from './hooks/useMUATablePagination';
import { useMUATableSelection } from './hooks/useMUATableSelection';
import { useMUATableExpansion } from './hooks/useMUATableExpansion';
import { useRoleToolbar } from './hooks/useRoleToolbar';

interface SelectedRole {
  display_name: string;
  [key: string]: any;
}

export interface MUARole {
  uuid: string;
  display_name: string;
  name: string;
  description: string;
  applications: string[];
  accessCount: number;
  permissions: number;
  isExpanded: boolean;
  access?: string[][]; // Array of [application, resource, operation] tuples
  groups_in_count?: number;
  [key: string]: any;
}

interface MUARolesTableProps {
  /**
   * The selected roles to display in the table.
   * Can be either:
   * - `string[]`: Array of role names (simple format)
   * - `SelectedRole[]`: Array of role objects with display_name property
   *
   * Component automatically normalizes both formats to role names internally.
   */
  roles: SelectedRole[] | string[];

  /**
   * Callback function to update the selected roles.
   * - When provided: Table is in **editable mode** (shows selection checkboxes, toolbar, "Select roles" title)
   * - When undefined: Table is in **read-only mode** (displays only selected roles, no interactions)
   *
   * @param roles - Array of selected role names
   */
  setRoles?: (roles: string[]) => void;
}

interface MUARolesTableViewProps {
  /** Whether the table is in read-only mode */
  isReadOnly: boolean;
  /** All available roles data */
  rows: MUARole[];
  /** Available applications for filtering */
  applications: string[];
  /** Current page of data to display */
  pagedRows: MUARole[];
  /** Filtered rows (for counts and no results) */
  filteredRows: MUARole[];
  /** Total number of items per page */
  perPage: number;
  /** Current page number */
  page: number;
  /** Whether any rows are selected */
  anySelected: boolean;
  /** Whether the "select all" checkbox should be checked */
  isChecked: boolean;
  /** Error state message */
  error: string | null;
  /** Whether there are active filters */
  hasFilters: boolean;
  /** Current name filter value */
  nameFilter: string;
  /** Current application filter selections */
  appSelections: string[];
  /** Active sort column index */
  activeSortIndex: number;
  /** Active sort direction */
  activeSortDirection: 'asc' | 'desc';
  /** Selected role names */
  selectedRoles: string[];
  /** Callback when a row is selected/deselected */
  onSelect?: (
    event: React.FormEvent<HTMLInputElement>,
    isSelected: boolean,
    rowIndex: number
  ) => void;
  /** Callback to check if a row is selected */
  getIsRowSelected?: (roleName: string) => boolean;
  /** Callback when a role is expanded/collapsed */
  onExpand: (role: MUARole) => void;
  /** Callback to check if a role is expanded */
  isRoleExpanded: (role: MUARole) => boolean;
  /** Callback when sort is changed */
  onSort: (
    event: React.MouseEvent,
    index: number,
    direction: 'asc' | 'desc'
  ) => void;
  /** Callback when page is changed */
  onSetPage: (
    event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    page: number
  ) => void;
  /** Callback when per page is changed */
  onPerPageSelect: (
    event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    perPage: number
  ) => void;
  /** Callback when name filter changes */
  setNameFilter: (filter: string) => void;
  /** Callback when application selections change */
  setAppSelections: React.Dispatch<React.SetStateAction<string[]>>;
  /** Callback when selected roles change */
  setSelectedRoles: (roles: string[]) => void;
  /** Callback to clear all filters */
  clearFilters: () => void;
  /** Callback for select all functionality */
  onSelectAll?: (
    event: React.FormEvent<HTMLInputElement> | null,
    isSelected: boolean
  ) => void;
}

/**
 * Pure presentational component for MUA roles table.
 * Displays roles in both read-only and editable modes with full table functionality.
 */
export function MUARolesTableView({
  isReadOnly,
  rows,
  applications,
  pagedRows,
  filteredRows,
  perPage,
  page,
  anySelected,
  isChecked,
  error,
  hasFilters,
  nameFilter,
  appSelections,
  activeSortIndex,
  activeSortDirection,
  selectedRoles,
  onSelect,
  getIsRowSelected,
  onExpand,
  isRoleExpanded,
  onSort,
  onSetPage,
  onPerPageSelect,
  setNameFilter,
  setAppSelections,
  setSelectedRoles,
  clearFilters,
}: MUARolesTableViewProps): React.ReactElement {
  const columns = ['Role name', 'Role description', 'Permissions'];
  const expandedColumns = ['Application', 'Resource type', 'Operation'];

  // Clear filters button
  const clearFiltersButton = (
    <Button variant="link" onClick={clearFilters}>
      Clear filters
    </Button>
  );

  // Pagination component
  const AccessRequestsPagination: React.FC<{ id: string }> = ({ id }) => (
    <Pagination
      itemCount={filteredRows.length}
      perPage={perPage}
      page={page}
      onSetPage={onSetPage}
      id={`access-requests-roles-table-pagination-${id}`}
      variant={id as any}
      onPerPageSelect={onPerPageSelect}
      isCompact={id === 'top'}
    />
  );

  // Role toolbar (only shown in editable mode)
  const roleToolbar = isReadOnly ? null : (
    <RoleToolbar
      selectedRoles={selectedRoles}
      setSelectedRoles={setSelectedRoles}
      isChecked={isChecked}
      appSelections={appSelections}
      setAppSelections={setAppSelections}
      columns={columns}
      rows={rows}
      filteredRows={filteredRows}
      pagedRows={pagedRows}
      anySelected={anySelected}
      clearFiltersButton={clearFiltersButton}
      perPage={perPage}
      nameFilter={nameFilter}
      setNameFilter={setNameFilter}
      AccessRequestsPagination={AccessRequestsPagination}
      applications={applications}
    />
  );

  // Loading skeleton row
  const renderSkeletonRow = (index: number) => (
    <Tbody key={`skeleton-${index}`}>
      <Tr>
        {!isReadOnly && <Td />}
        {columns.map((col, colIndex) => (
          <Td dataLabel={col} key={colIndex}>
            <div
              style={{ height: '22px' }}
              className="ins-c-skeleton ins-c-skeleton__md"
            >
              {' '}
            </div>
          </Td>
        ))}
      </Tr>
    </Tbody>
  );

  // Permission skeleton row for expanded view
  const renderPermissionSkeletonRow = (index: number) => (
    <Tr key={`permission-skeleton-${index}`}>
      {expandedColumns.map((col) => (
        <Td key={col} dataLabel={col}>
          <div
            style={{ height: '22px' }}
            className="ins-c-skeleton ins-c-skeleton__sm"
          >
            {' '}
          </div>
        </Td>
      ))}
    </Tr>
  );

  // Main table
  const roleTable = (
    <Table aria-label="My user access roles" variant={TableVariant.compact}>
      <Thead>
        <Tr>
          {!isReadOnly && <Th />}
          <Th
            width={30}
            sort={{
              sortBy: {
                index: activeSortIndex,
                direction: activeSortDirection,
              },
              onSort,
              columnIndex: 0,
            }}
          >
            {columns[0]}
          </Th>
          <Th
            width={50}
            sort={{
              sortBy: {
                index: activeSortIndex,
                direction: activeSortDirection,
              },
              onSort,
              columnIndex: 1,
            }}
          >
            {columns[1]}
          </Th>
          <Th
            width={10}
            sort={{
              sortBy: {
                index: activeSortIndex,
                direction: activeSortDirection,
              },
              onSort,
              columnIndex: 2,
            }}
            modifier="nowrap"
          >
            {columns[2]}
          </Th>
        </Tr>
      </Thead>

      {/* Loading skeletons */}
      {rows.length === 0 &&
        [...Array(perPage).keys()].map((i) => renderSkeletonRow(i))}

      {/* Data rows */}
      {pagedRows.map((row, rowIndex) => (
        <Tbody key={row.uuid}>
          <Tr>
            {!isReadOnly && onSelect && getIsRowSelected && (
              <Td
                select={{
                  rowIndex,
                  onSelect,
                  isSelected: getIsRowSelected(row.display_name),
                }}
              />
            )}
            <Td dataLabel={columns[0]}>{row.display_name}</Td>
            <Td dataLabel={columns[1]} className="pf-v5-m-truncate">
              <Tooltip entryDelay={1000} content={row.description}>
                <span className="pf-v5-m-truncate pf-v5-c-table__text">
                  {row.description}
                </span>
              </Tooltip>
            </Td>
            <Td
              dataLabel={columns[2]}
              className={css(
                'pf-c-table__compound-expansion-toggle',
                isRoleExpanded(row) && 'pf-v5-m-expanded'
              )}
            >
              <button
                type="button"
                className="pf-v5-c-table__button"
                onClick={() => onExpand(row)}
              >
                {row.permissions}
              </button>
            </Td>
          </Tr>

          {/* Expanded row for permissions */}
          <Tr isExpanded={isRoleExpanded(row)}>
            {!isReadOnly && <Td />}
            <Td className="pf-v5-u-p-0" colSpan={3}>
              <Table className="pf-v5-m-no-border-rows">
                <Thead>
                  <Tr>
                    {expandedColumns.map((col) => (
                      <Th key={col}>{col}</Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {Array.isArray(row.access)
                    ? row.access.map((permissions) => (
                        <Tr key={permissions.join(':')}>
                          <Td dataLabel={expandedColumns[0]}>
                            {permissions[0]}
                          </Td>
                          <Td dataLabel={expandedColumns[1]}>
                            {permissions[1]}
                          </Td>
                          <Td dataLabel={expandedColumns[2]}>
                            {permissions[2]}
                          </Td>
                        </Tr>
                      ))
                    : [...Array(row.permissions).keys()].map((i) =>
                        renderPermissionSkeletonRow(i)
                      )}
                </Tbody>
              </Table>
            </Td>
          </Tr>
        </Tbody>
      ))}

      {/* No results */}
      {pagedRows.length === 0 && hasFilters && (
        <MUANoResults
          columns={columns}
          clearFiltersButton={clearFiltersButton}
        />
      )}
    </Table>
  );

  if (error) {
    return (
      <div>
        <p>Error loading roles: {error}</p>
        <Button variant="link" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <React.Fragment>
      {!isReadOnly && (
        <React.Fragment>
          <Title headingLevel="h2">Select roles</Title>
          <p>Select the roles you would like access to.</p>
        </React.Fragment>
      )}
      {roleToolbar}
      {roleTable}
      {isReadOnly && <AccessRequestsPagination id="bottom" />}
    </React.Fragment>
  );
}

const MUARolesTable: React.FC<MUARolesTableProps> = ({
  roles: selectedRoles,
  setRoles: setSelectedRoles,
}) => {
  const isReadOnly = setSelectedRoles === undefined;

  // Normalize selectedRoles to string array
  const normalizedSelectedRoles = React.useMemo(() => {
    return selectedRoles.map((role) =>
      typeof role === 'string' ? role : role.display_name
    );
  }, [selectedRoles]);

  // Data management
  const { rows, setRows, applications, error, fetchRolePermissions } =
    useMUATableData();

  // Filtering
  const {
    nameFilter,
    setNameFilter,
    appSelections,
    setAppSelections,
    filteredRows,
    hasFilters,
    clearFilters,
  } = useMUATableFiltering({
    rows,
    selectedRoles: normalizedSelectedRoles,
    isReadOnly,
  });

  // Sorting
  const { activeSortIndex, activeSortDirection, sortedRows, onSort } =
    useMUATableSorting({
      rows: filteredRows,
    });

  // Pagination
  const { page, perPage, pagedRows, onSetPage, onPerPageSelect } =
    useMUATablePagination({
      rows: sortedRows,
    });

  // Selection (only used in editable mode)
  const selectionProps = useMUATableSelection({
    selectedRoles: normalizedSelectedRoles,
    setSelectedRoles: setSelectedRoles || (() => {}),
    filteredRows,
  });

  // Row expansion
  const { onExpand, isRoleExpanded } = useMUATableExpansion({
    rows,
    setRows,
    fetchRolePermissions,
  });

  // Role toolbar functionality
  const { onSelectAll } = useRoleToolbar({
    setSelectedRoles: setSelectedRoles || (() => {}),
    filteredRows,
    columns: ['Role name', 'Role description', 'Permissions'],
    appSelections,
    setAppSelections,
    nameFilter,
  });

  return (
    <MUARolesTableView
      isReadOnly={isReadOnly}
      rows={rows}
      applications={applications}
      pagedRows={pagedRows}
      filteredRows={filteredRows}
      perPage={perPage}
      page={page}
      anySelected={selectionProps.anySelected}
      isChecked={selectionProps.isChecked || false}
      error={error}
      hasFilters={hasFilters}
      nameFilter={nameFilter}
      appSelections={appSelections}
      activeSortIndex={activeSortIndex}
      activeSortDirection={activeSortDirection}
      selectedRoles={normalizedSelectedRoles}
      onSelect={selectionProps.onSelect}
      getIsRowSelected={selectionProps.getIsRowSelected}
      onExpand={onExpand}
      isRoleExpanded={isRoleExpanded}
      onSort={onSort}
      onSetPage={onSetPage}
      onPerPageSelect={onPerPageSelect}
      setNameFilter={setNameFilter}
      setAppSelections={setAppSelections}
      setSelectedRoles={setSelectedRoles || (() => {})}
      clearFilters={clearFilters}
      onSelectAll={onSelectAll}
    />
  );
};

export default MUARolesTable;
