import React from 'react';
import { useIntl } from 'react-intl';
import {
  capitalize,
  Dropdown,
  DropdownItem,
  DropdownList,
  InputGroup,
  InputGroupItem,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  TextInput,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { BulkSelect } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { FilterIcon } from '@patternfly/react-icons';
import { useRoleToolbar } from './hooks/useRoleToolbar';
import { BulkSelectValue } from '@patternfly/react-component-groups';

const toolbarMessages = {
  roleName: {
    id: 'accessRequests.mua.toolbar.roleName',
    defaultMessage: 'Role name',
  },
  application: {
    id: 'accessRequests.mua.toolbar.application',
    defaultMessage: 'Application',
  },
  selectApplicationsAria: {
    id: 'accessRequests.mua.toolbar.selectApplicationsAria',
    defaultMessage: 'Select applications',
  },
  searchInputAria: {
    id: 'accessRequests.mua.toolbar.searchInputAria',
    defaultMessage: 'Search input',
  },
};

const selectLabelId = 'filter-application';
const selectPlaceholder = 'Filter by application';

interface RoleRow {
  display_name: string;

  [key: string]: any;
}

interface RoleToolbarProps {
  selectedRoles: string[];
  setSelectedRoles: (roles: string[]) => void;
  isPageSelected: boolean;
  isPagePartiallySelected: boolean;
  appSelections: string[];
  setAppSelections: React.Dispatch<React.SetStateAction<string[]>>;
  columns: string[];
  rows: RoleRow[];
  filteredRows: RoleRow[];
  pagedRows: RoleRow[];
  onClearFilters: () => void;
  perPage: number;
  nameFilter: string;
  setNameFilter: (filter: string) => void;
  AccessRequestsPagination: React.ComponentType<{ id: string }>;
  applications: string[];
}

const RoleToolbar: React.FC<RoleToolbarProps> = ({
  selectedRoles,
  setSelectedRoles,
  isPageSelected,
  isPagePartiallySelected,
  appSelections,
  setAppSelections,
  columns,
  filteredRows,
  pagedRows,
  onClearFilters,
  nameFilter,
  setNameFilter,
  AccessRequestsPagination,
  applications,
}) => {
  const intl = useIntl();
  const {
    state,
    hasFilters,
    onSelectAll,
    handleFilterColumnSelect,
    handleAppSelection,
    handleToggleDropdown,
    handleToggleSelect,
  } = useRoleToolbar({
    setSelectedRoles,
    filteredRows,
    columns,
    appSelections,
    setAppSelections,
    nameFilter,
  });

  const handleBulkSelect = (value: BulkSelectValue) => {
    value === BulkSelectValue.none && onSelectAll(false);
    value === BulkSelectValue.all && onSelectAll(true);
    value === BulkSelectValue.nonePage && onSelectAll(false);
    value === BulkSelectValue.page &&
      setSelectedRoles(
        selectedRoles.concat(pagedRows.map((r) => r.display_name))
      );
  };

  return (
    <React.Fragment>
      <Toolbar
        id="access-requests-roles-table-toolbar"
        clearAllFilters={onClearFilters}
      >
        <ToolbarContent>
          <ToolbarItem>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <BulkSelect
                id="bulk-select-checkbox"
                selectedCount={selectedRoles.length}
                onSelect={handleBulkSelect}
                pageSelected={isPageSelected}
                pagePartiallySelected={isPagePartiallySelected}
              />
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
                    {[
                      intl.formatMessage(toolbarMessages.roleName),
                      intl.formatMessage(toolbarMessages.application),
                    ].map((colName) => (
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
                    aria-label={intl.formatMessage(
                      toolbarMessages.selectApplicationsAria
                    )}
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
                  aria-label={intl.formatMessage(
                    toolbarMessages.searchInputAria
                  )}
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
          {hasFilters && (
            <ToolbarGroup variant="filter-group">
              {nameFilter && (
                <ToolbarFilter
                  labels={[nameFilter]}
                  deleteLabel={() => setNameFilter('')}
                  deleteLabelGroup={() => setNameFilter('')}
                  categoryName={intl.formatMessage(toolbarMessages.roleName)}
                >
                  {nameFilter}
                </ToolbarFilter>
              )}
              {appSelections.length > 0 && (
                <ToolbarFilter
                  labels={appSelections}
                  deleteLabel={(_, label) =>
                    setAppSelections((prev) =>
                      prev.filter((an) => an !== label)
                    )
                  }
                  deleteLabelGroup={() => setAppSelections([])}
                  categoryName={intl.formatMessage(toolbarMessages.application)}
                >
                  {nameFilter}
                </ToolbarFilter>
              )}
            </ToolbarGroup>
          )}
        </ToolbarContent>
      </Toolbar>
    </React.Fragment>
  );
};

export default RoleToolbar;
