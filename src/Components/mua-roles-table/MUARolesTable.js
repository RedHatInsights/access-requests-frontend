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
import { useDispatch } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/redux';
import PropTypes from 'prop-types';
import apiInstance from '../../Helpers/apiInstance';
import RoleToolbar from './RoleToolbar';
import MUANoResults from './MUANoResults';

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
  const [appSelections, setAppSelections] = React.useState([]);
  React.useEffect(() => {
    if (rolesCache.length === 0 || applicationsCache.length === 0) {
      apiInstance
        .get(
          `${API_BASE}/roles/?system=true&limit=9999&order_by=display_name&add_fields=groups_in_count`,
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

  const [nameFilter, setNameFilter] = React.useState('');
  const hasFilters = appSelections.length > 0 || nameFilter;

  const selectedNames = selectedRoles.map((role) => role.display_name);
  const filteredRows = rows
    .filter((row) =>
      appSelections.length > 0
        ? row.applications.find((app) => appSelections.includes(app))
        : true
    )
    .filter((row) =>
      row.display_name.toLowerCase().includes(nameFilter.toLowerCase())
    )
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
      id={`access-requests-roles-table-pagination-${id}`}
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
      clearFiltersButton={clearFiltersButton}
      perPage={perPage}
      nameFilter={nameFilter}
      setNameFilter={setNameFilter}
      AccessRequestsPagination={AccessRequestsPagination}
      applications={applications}
    />
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
                row.isExpanded && 'pf-v5-m-expanded'
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
          <Tr isExpanded={row.isExpanded}>
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
              </Table>
            </Td>
          </Tr>
        </Tbody>
      ))}
      {pagedRows.length === 0 && hasFilters ? (
        <MUANoResults
          columns={columns}
          clearFiltersButton={clearFiltersButton}
        />
      ) : null}
    </Table>
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
