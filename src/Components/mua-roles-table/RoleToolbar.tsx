import React from 'react';
import {
  Label,
  LabelGroup,
  capitalize,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  InputGroup,
  TextInput,
  InputGroupItem,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  Checkbox,
  Select,
  SelectList,
  SelectOption,
} from '@patternfly/react-core';
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
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Checkbox
                id="bulk-select-checkbox"
                aria-label={anySelected ? 'Deselect all' : 'Select all'}
                isChecked={isChecked}
                onChange={(
                  event: React.FormEvent<HTMLInputElement>,
                  checked: boolean
                ) => onSelectAll(event, checked)}
                isDisabled={rows.length === 0}
              />
              <Dropdown
                onSelect={() => handleToggleBulkSelect(!state.isBulkSelectOpen)}
                isOpen={state.isBulkSelectOpen}
                onOpenChange={(isOpen: boolean) =>
                  handleToggleBulkSelect(isOpen)
                }
                toggle={(toggleRef: React.Ref<any>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() =>
                      handleToggleBulkSelect(!state.isBulkSelectOpen)
                    }
                    isExpanded={state.isBulkSelectOpen}
                    variant="plain"
                    isDisabled={rows.length === 0}
                    aria-label="Bulk select options"
                  >
                    {selectedRoles.length !== 0 && (
                      <React.Fragment>
                        {selectedRoles.length} selected
                      </React.Fragment>
                    )}
                  </MenuToggle>
                )}
              >
                <DropdownList>
                  <DropdownItem
                    onClick={(event: React.MouseEvent) =>
                      onSelectAll(event, false)
                    }
                  >
                    Select none (0 items)
                  </DropdownItem>
                  <DropdownItem
                    onClick={() =>
                      setSelectedRoles(
                        selectedRoles.concat(
                          pagedRows.map((r) => r.display_name)
                        )
                      )
                    }
                  >
                    Select page ({Math.min(pagedRows.length, perPage)} items)
                  </DropdownItem>
                  <DropdownItem
                    onClick={(event: React.MouseEvent) =>
                      onSelectAll(event, true)
                    }
                  >
                    Select all ({filteredRows.length} items)
                  </DropdownItem>
                </DropdownList>
              </Dropdown>
            </div>
          </ToolbarItem>
          <ToolbarItem>
            <InputGroup>
              <InputGroupItem>
                <Dropdown
                  isOpen={state.isDropdownOpen}
                  onSelect={(
                    event?: React.MouseEvent<Element, MouseEvent>,
                    value?: string | number
                  ) => {
                    if (value) {
                      handleFilterColumnSelect(value.toString());
                    }
                  }}
                  onOpenChange={(isOpen: boolean) =>
                    handleToggleDropdown(isOpen)
                  }
                  toggle={(toggleRef: React.Ref<any>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() =>
                        handleToggleDropdown(!state.isDropdownOpen)
                      }
                      isExpanded={state.isDropdownOpen}
                      icon={<FilterIcon />}
                    >
                      {state.filterColumn}
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    {['Role name', 'Application'].map((colName) => (
                      <DropdownItem key={colName} value={colName}>
                        {capitalize(colName)}
                      </DropdownItem>
                    ))}
                  </DropdownList>
                </Dropdown>
              </InputGroupItem>
              {state.filterColumn === 'Application' ? (
                <React.Fragment>
                  <span id={selectLabelId} hidden>
                    {selectPlaceholder}
                  </span>
                  <Select
                    aria-labelledby={selectLabelId}
                    aria-label="Select applications"
                    isOpen={state.isSelectOpen}
                    selected={appSelections}
                    onSelect={(
                      event?: React.MouseEvent<Element, MouseEvent>,
                      value?: string | number
                    ) => {
                      if (value) {
                        handleAppSelection(value.toString());
                      }
                    }}
                    onOpenChange={(isOpen: boolean) =>
                      handleToggleSelect(isOpen)
                    }
                    toggle={(toggleRef: React.Ref<any>) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => handleToggleSelect(!state.isSelectOpen)}
                        isExpanded={state.isSelectOpen}
                        style={{ width: '200px' }}
                      >
                        {appSelections.length > 0
                          ? `${appSelections.length} selected`
                          : selectPlaceholder}
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      {applications.map((app) => (
                        <SelectOption
                          key={app}
                          value={app}
                          hasCheckbox
                          isSelected={appSelections.includes(app)}
                        >
                          {capitalize(app.replace(/-/g, ' '))}
                        </SelectOption>
                      ))}
                    </SelectList>
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
                  onChange={(
                    event: React.FormEvent<HTMLInputElement>,
                    val: string
                  ) => setNameFilter(val)}
                />
              )}
            </InputGroup>
          </ToolbarItem>
          <ToolbarItem variant="pagination" align={{ default: 'alignEnd' }}>
            <AccessRequestsPagination id="top" />
          </ToolbarItem>
        </ToolbarContent>
        {hasFilters && (
          <ToolbarContent>
            {nameFilter && (
              <LabelGroup categoryName="Role name">
                <Label variant="outline" onClose={() => setNameFilter('')}>
                  {nameFilter}
                </Label>
              </LabelGroup>
            )}
            {appSelections.length > 0 && (
              <LabelGroup categoryName="Status">
                {appSelections.map((status) => (
                  <Label
                    variant="outline"
                    key={status}
                    onClose={() =>
                      setAppSelections((prev) =>
                        prev.filter((s) => s !== status)
                      )
                    }
                  >
                    {status}
                  </Label>
                ))}
              </LabelGroup>
            )}
            {clearFiltersButton}
          </ToolbarContent>
        )}
      </Toolbar>
    </React.Fragment>
  );
};

export default RoleToolbar;
