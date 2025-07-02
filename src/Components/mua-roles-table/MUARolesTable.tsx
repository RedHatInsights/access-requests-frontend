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

interface SelectedRole {
  display_name: string;
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

const MUARolesTable: React.FC<MUARolesTableProps> = ({
  roles: selectedRoles,
  setRoles: setSelectedRoles,
}) => {
  const isReadOnly = setSelectedRoles === undefined;
  const columns = ['Role name', 'Role description', 'Permissions'];
  const expandedColumns = ['Application', 'Resource type', 'Operation'];

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
      selectedRoles={normalizedSelectedRoles}
      setSelectedRoles={setSelectedRoles || (() => {})}
      isChecked={selectionProps.isChecked || false}
      appSelections={appSelections}
      setAppSelections={setAppSelections}
      columns={columns}
      rows={rows}
      filteredRows={filteredRows}
      pagedRows={pagedRows}
      anySelected={selectionProps.anySelected}
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
            {!isReadOnly && (
              <Td
                select={{
                  rowIndex,
                  onSelect: selectionProps.onSelect,
                  isSelected: selectionProps.getIsRowSelected(row.display_name),
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
};

export default MUARolesTable;
