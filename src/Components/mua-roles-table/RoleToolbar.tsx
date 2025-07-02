import React from 'react';
import {
  capitalize,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  InputGroup,
  TextInput,
  ChipGroup,
  Chip,
  InputGroupItem,
} from '@patternfly/react-core';
import {
  Dropdown,
  DropdownItem,
  DropdownToggle,
  DropdownToggleCheckbox,
  Select,
  SelectOption,
} from '@patternfly/react-core/deprecated';
import { FilterIcon } from '@patternfly/react-icons';
import { useRoleToolbar } from './hooks/useRoleToolbar';

const selectLabelId = 'filter-application';
const selectPlaceholder = 'Filter by application';

interface RoleRow {
  display_name: string;
  [key: string]: any;
}

interface RoleToolbarProps {
  selectedRoles: string[];
  setSelectedRoles: (roles: string[]) => void;
  isChecked: boolean;
  appSelections: string[];
  setAppSelections: React.Dispatch<React.SetStateAction<string[]>>;
  columns: string[];
  rows: RoleRow[];
  filteredRows: RoleRow[];
  pagedRows: RoleRow[];
  anySelected: boolean;
  clearFiltersButton: React.ReactElement;
  perPage: number;
  nameFilter: string;
  setNameFilter: (filter: string) => void;
  AccessRequestsPagination: React.ComponentType<{ id: string }>;
  applications: string[];
}

const RoleToolbar: React.FC<RoleToolbarProps> = ({
  selectedRoles,
  setSelectedRoles,
  isChecked,
  appSelections,
  setAppSelections,
  columns,
  rows,
  filteredRows,
  pagedRows,
  anySelected,
  clearFiltersButton,
  perPage,
  nameFilter,
  setNameFilter,
  AccessRequestsPagination,
  applications,
}) => {
  const {
    state,
    hasFilters,
    onSelectAll,
    handleFilterColumnSelect,
    handleAppSelection,
    handleToggleDropdown,
    handleToggleSelect,
    handleToggleBulkSelect,
  } = useRoleToolbar({
    setSelectedRoles,
    filteredRows,
    columns,
    appSelections,
    setAppSelections,
    nameFilter,
  });

  return (
    <React.Fragment>
      <Toolbar id="access-requests-roles-table-toolbar">
        <ToolbarContent>
          <ToolbarItem>
            <Dropdown
              onSelect={() => handleToggleBulkSelect(!state.isBulkSelectOpen)}
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
                  onToggle={(_event, isOpen) => handleToggleBulkSelect(isOpen)}
                  disabled={rows.length === 0}
                >
                  {selectedRoles.length !== 0 && (
                    <React.Fragment>
                      {selectedRoles.length} selected
                    </React.Fragment>
                  )}
                </DropdownToggle>
              }
              isOpen={state.isBulkSelectOpen}
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
              <InputGroupItem>
                <Dropdown
                  isOpen={state.isDropdownOpen}
                  onSelect={handleFilterColumnSelect}
                  toggle={
                    <DropdownToggle
                      onToggle={(_event, isOpen) =>
                        handleToggleDropdown(isOpen)
                      }
                    >
                      <FilterIcon /> {state.filterColumn}
                    </DropdownToggle>
                  }
                  dropdownItems={['Role name', 'Application'].map((colName) => (
                    <DropdownItem
                      key={colName}
                      value={colName}
                      component="button"
                    >
                      {capitalize(colName)}
                    </DropdownItem>
                  ))}
                />
              </InputGroupItem>
              {state.filterColumn === 'Application' ? (
                <React.Fragment>
                  <span id={selectLabelId} hidden>
                    {selectPlaceholder}
                  </span>
                  <Select
                    aria-labelledby={selectLabelId}
                    variant="checkbox"
                    aria-label="Select applications"
                    onToggle={(_event, isOpen) => handleToggleSelect(isOpen)}
                    onSelect={handleAppSelection}
                    isOpen={state.isSelectOpen}
                    selections={appSelections}
                    isCheckboxSelectionBadgeHidden
                    placeholderText={selectPlaceholder}
                    className="select-toolbar"
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
                  aria-label="Search input"
                  placeholder="Filter by role name"
                  value={nameFilter}
                  onChange={(_event, val) => setNameFilter(val)}
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
                      setAppSelections((prev) =>
                        prev.filter((s) => s !== status)
                      )
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
    </React.Fragment>
  );
};

export default RoleToolbar;
