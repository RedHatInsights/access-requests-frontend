import React from 'react';
import {
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Select,
  Dropdown,
  SelectOption,
  DropdownItem,
  DropdownToggle,
  InputGroup,
  TextInput,
  Button,
  Pagination,
  ChipGroup,
  Chip,
  DropdownToggleCheckbox,
  Tooltip,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
} from '@patternfly/react-core';
import {
  TableComposable,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@patternfly/react-table';
import FilterIcon from '@patternfly/react-icons/dist/js/icons/filter-icon';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';
import { capitalize } from '@patternfly/react-core/dist/esm/helpers/util';
import { css } from '@patternfly/react-styles';
import { useDispatch } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/redux';
import PropTypes from 'prop-types';
import apiInstance from '../Helpers/apiInstance';

let rolesCache = [];
let applicationsCache = [];

const MUARolesTable = ({
  roles: selectedRoles,
  setRoles: setSelectedRoles,
}) => {
  const isReadOnly = setSelectedRoles === undefined;
  const columns = ['Role name', 'Role description', 'Permissions'];
  const [rows, setRows] = React.useState(Array.from(rolesCache));
  const [applications, setApplications] = React.useState(applicationsCache);
  React.useEffect(() => {
    if (rolesCache.length === 0 || applicationsCache.length === 0) {
      apiInstance
        .get(
          `${API_BASE}/roles/?limit=9999&order_by=display_name&add_fields=groups_in_count`,
          { headers: { Accept: 'application/json' } }
        )
        .then(({ data }) => {
          data.forEach((role) => {
            role.isExpanded = false;
            role.permissions = role.accessCount;
          });
          rolesCache = data.map((role) => Object.assign({}, role));
          setRows(data);

          // Build application filter from data
          const apps = Array.from(
            data
              .map((role) => role.applications)
              .flat()
              .reduce((acc, cur) => {
                acc.add(cur);
                return acc;
              }, new Set())
          ).sort();
          applicationsCache = apps;
          setApplications(apps);
        })
        .catch((err) =>
          dispatch(
            addNotification({
              variant: 'danger',
              title: 'Could not fetch roles list',
              description: err.message,
            })
          )
        );
    }
  }, []);

  // Sorting
  const [activeSortIndex, setActiveSortIndex] = React.useState('name');
  const [activeSortDirection, setActiveSortDirection] = React.useState('asc');
  const onSort = (_ev, index, direction) => {
    setActiveSortIndex(index);
    setActiveSortDirection(direction);
  };

  // Filtering
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [filterColumn, setFilterColumn] = React.useState(columns[0]);
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);
  const [appSelections, setAppSelections] = React.useState([]);
  const [nameFilter, setNameFilter] = React.useState('');
  const hasFilters = appSelections.length > 0 || nameFilter;
  const selectLabelId = 'filter-application';
  const selectPlaceholder = 'Filter by application';

  const selectedNames = selectedRoles.map((role) => role.display_name);
  const filteredRows = rows
    .filter((row) =>
      appSelections.length > 0
        ? row.applications.find((app) => appSelections.includes(app))
        : true
    )
    .filter((row) => row.name.toLowerCase().includes(nameFilter))
    .filter((row) =>
      isReadOnly ? selectedNames.includes(row.display_name) : true
    );

  // Pagination
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const AccessRequestsPagination = ({ id }) => (
    <Pagination
      itemCount={filteredRows.length}
      perPage={perPage}
      page={page}
      onSetPage={(_ev, pageNumber) => setPage(pageNumber)}
      id={'access-requests-roles-table-pagination-' + id}
      variant={id}
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
  const pagedRows = filteredRows
    .sort((a, b) => {
      if (typeof a[activeSortIndex] === 'number') {
        // numeric sort
        if (activeSortDirection === 'asc') {
          return a[activeSortIndex] - b[activeSortIndex];
        }

        return b[activeSortIndex] - a[activeSortIndex];
      } else {
        // string sort
        if (activeSortDirection === 'asc') {
          return (a[activeSortIndex] + '').localeCompare(b[activeSortIndex]);
        }

        return (b[activeSortIndex] + '').localeCompare(a[activeSortIndex]);
      }
    })
    .slice((page - 1) * perPage, page * perPage);

  // Selecting
  const [isBulkSelectOpen, setIsBulkSelectOpen] = React.useState(false);
  const anySelected = selectedRoles.length > 0;
  const someChecked = anySelected ? null : false;
  const isChecked =
    selectedRoles.length === filteredRows.length && selectedRoles.length > 0
      ? true
      : someChecked;
  const onSelect = (_ev, isSelected, rowId) => {
    const changed = pagedRows[rowId].display_name;
    if (isSelected) {
      setSelectedRoles(selectedRoles.concat(changed));
    } else {
      setSelectedRoles(selectedRoles.filter((role) => role !== changed));
    }
  };

  const onSelectAll = (_ev, isSelected) => {
    if (isSelected) {
      setSelectedRoles(filteredRows.map((row) => row.display_name));
    } else {
      setSelectedRoles([]);
    }
  };

  const clearFiltersButton = (
    <Button
      variant="link"
      onClick={() => {
        setAppSelections([]);
        setNameFilter('');
      }}
    >
      Clear filters
    </Button>
  );
  const roleToolbar = isReadOnly ? null : (
    <Toolbar id="access-requests-roles-table-toolbar">
      <ToolbarContent>
        <ToolbarItem>
          <Dropdown
            onSelect={() => setIsBulkSelectOpen(!isBulkSelectOpen)}
            position="left"
            toggle={
              <DropdownToggle
                splitButtonItems={[
                  <DropdownToggleCheckbox
                    key="a"
                    id="example-checkbox-2"
                    aria-label={anySelected ? 'Deselect all' : 'Select all'}
                    isChecked={isChecked}
                    onClick={() => onSelectAll(null, !anySelected)}
                  />,
                ]}
                onToggle={(isOpen) => setIsBulkSelectOpen(isOpen)}
                isDisabled={rows.length === 0}
              >
                {selectedRoles.length !== 0 && (
                  <React.Fragment>
                    {selectedRoles.length} selected
                  </React.Fragment>
                )}
              </DropdownToggle>
            }
            isOpen={isBulkSelectOpen}
            dropdownItems={[
              <DropdownItem key="0" onClick={() => onSelectAll(null, false)}>
                Select none (0 items)
              </DropdownItem>,
              <DropdownItem
                key="1"
                onClick={() =>
                  setSelectedRoles(
                    selectedRoles.concat(pagedRows.map((r) => r.display_name))
                  )
                }
              >
                Select page ({Math.min(pagedRows.length, perPage)} items)
              </DropdownItem>,
              <DropdownItem key="2" onClick={() => onSelectAll(null, true)}>
                Select all ({filteredRows.length} items)
              </DropdownItem>,
            ]}
          />
        </ToolbarItem>
        <ToolbarItem>
          <InputGroup>
            <Dropdown
              isOpen={isDropdownOpen}
              onSelect={(ev) => {
                setIsDropdownOpen(false);
                setFilterColumn(ev.target.value);
                setIsSelectOpen(false);
              }}
              toggle={
                <DropdownToggle
                  onToggle={(isOpen) => setIsDropdownOpen(isOpen)}
                >
                  <FilterIcon /> {filterColumn}
                </DropdownToggle>
              }
              dropdownItems={['Role name', 'Application'].map((colName) => (
                // Filterable columns are RequestID, AccountID, and Status
                <DropdownItem key={colName} value={colName} component="button">
                  {capitalize(colName)}
                </DropdownItem>
              ))}
            />
            {filterColumn === 'Application' ? (
              <React.Fragment>
                <span id={selectLabelId} hidden>
                  {selectPlaceholder}
                </span>
                <Select
                  aria-labelledby={selectLabelId}
                  variant="checkbox"
                  aria-label="Select applications"
                  onToggle={(isOpen) => setIsSelectOpen(isOpen)}
                  onSelect={(_ev, selection) => {
                    if (appSelections.includes(selection)) {
                      setAppSelections(
                        appSelections.filter((s) => s !== selection)
                      );
                    } else {
                      setAppSelections([...appSelections, selection]);
                    }
                  }}
                  isOpen={isSelectOpen}
                  selections={appSelections}
                  isCheckboxSelectionBadgeHidden
                  placeholderText={selectPlaceholder}
                  style={{ maxHeight: '400px', overflowY: 'auto' }}
                >
                  {applications.map((app) => (
                    <SelectOption key={app} value={app}>
                      {capitalize(app.replace(/-/g, ' '))}
                    </SelectOption>
                  ))}
                </Select>
              </React.Fragment>
            ) : (
              <TextInput
                name="rolesSearch"
                id="rolesSearch"
                type="search"
                iconVariant="search"
                aria-label="Search input"
                placeholder="Filter by role name"
                value={nameFilter}
                onChange={(val) => setNameFilter(val)}
              />
            )}
          </InputGroup>
        </ToolbarItem>
        <ToolbarItem variant="pagination" align={{ default: 'alignRight' }}>
          <AccessRequestsPagination id="top" />
        </ToolbarItem>
      </ToolbarContent>
      {hasFilters && (
        <ToolbarContent>
          {nameFilter && (
            <ChipGroup categoryName="Role name">
              <Chip onClick={() => setNameFilter('')}>{nameFilter}</Chip>
            </ChipGroup>
          )}
          {appSelections.length > 0 && (
            <ChipGroup categoryName="Status">
              {appSelections.map((status) => (
                <Chip
                  key={status}
                  onClick={() =>
                    setAppSelections(appSelections.filter((s) => s !== status))
                  }
                >
                  {status}
                </Chip>
              ))}
            </ChipGroup>
          )}
          {clearFiltersButton}
        </ToolbarContent>
      )}
    </Toolbar>
  );

  const expandedColumns = ['Application', 'Resource type', 'Operation'];
  const dispatch = useDispatch();
  const onExpand = (row) => {
    row.isExpanded = !row.isExpanded;
    setRows([...rows]);
    if (!row.access) {
      apiInstance
        .get(`${API_BASE}/roles/${row.uuid}/`, {
          headers: { Accept: 'application/json' },
        })
        .then((res) => {
          row.access = res.access.map((a) => a.permission.split(':'));
          setRows([...rows]);
        })
        .catch((err) =>
          dispatch(
            addNotification({
              variant: 'danger',
              title: `Could not fetch permission list for ${row.name}.`,
              description: err.message,
            })
          )
        );
    }
  };
  const roleTable = (
    <TableComposable aria-label="My user access roles" variant="compact">
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
              columnIndex: 'name',
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
              columnIndex: 'description',
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
              columnIndex: 'permissions',
            }}
            modifier="nowrap"
          >
            {columns[2]}
          </Th>
        </Tr>
      </Thead>
      {rows.length === 0 &&
        [...Array(perPage).keys()].map((i) => (
          <Tbody key={i}>
            <Tr>
              {!isReadOnly && <Td />}
              {columns.map((col, key) => (
                <Td dataLabel={col} key={key}>
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
        ))}
      {pagedRows.map((row, rowIndex) => (
        <Tbody key={rowIndex}>
          <Tr>
            {!isReadOnly && (
              <Td
                select={{
                  rowIndex,
                  onSelect,
                  isSelected: selectedRoles.find((r) => r === row.display_name),
                }}
              />
            )}
            <Td dataLabel={columns[0]}>{row.display_name}</Td>
            <Td dataLabel={columns[1]} className="pf-m-truncate">
              <Tooltip entryDelay={1000} content={row.description}>
                <span className="pf-m-truncate pf-c-table__text">
                  {row.description}
                </span>
              </Tooltip>
            </Td>
            <Td
              dataLabel={columns[2]}
              className={css(
                'pf-c-table__compound-expansion-toggle',
                row.isExpanded && 'pf-m-expanded'
              )}
            >
              <button
                type="button"
                className="pf-c-table__button"
                onClick={() => onExpand(row)}
              >
                {row.permissions}
              </button>
            </Td>
          </Tr>
          <Tr isExpanded={row.isExpanded} borders={false}>
            {!isReadOnly && <Td />}
            <Td className="pf-u-p-0" colSpan={3}>
              <TableComposable isCompact className="pf-m-no-border-rows">
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
                    : [...Array(row.permissions).keys()].map((i) => (
                        <Tr key={i}>
                          {expandedColumns.map((val) => (
                            <Td key={val} dataLabel={val}>
                              <div
                                style={{ height: '22px' }}
                                className="ins-c-skeleton ins-c-skeleton__sm"
                              >
                                {' '}
                              </div>
                            </Td>
                          ))}
                        </Tr>
                      ))}
                </Tbody>
              </TableComposable>
            </Td>
          </Tr>
        </Tbody>
      ))}
      {pagedRows.length === 0 && hasFilters && (
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
    </TableComposable>
  );

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

MUARolesTable.propTypes = {
  roles: PropTypes.any,
  setRoles: PropTypes.any,
};

export default MUARolesTable;
