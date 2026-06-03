import { renderHook, act } from '@testing-library/react';
import { useMUATableRolesSelection } from './useMUATableRolesSelection';

const makeRole = (name: string) => ({
  uuid: name,
  display_name: name,
  name,
  description: '',
  applications: [],
  accessCount: 0,
  permissions: 0,
  isExpanded: false,
});

const PAGE_1 = ['Role A', 'Role B', 'Role C'].map(makeRole);
const PAGE_2 = ['Role D', 'Role E', 'Role F'].map(makeRole);

describe('useMUATableRolesSelection', () => {
  it('selects the correct role by rowId on page 1', () => {
    let selectedRoles: string[] = [];
    const setSelectedRoles = (roles: string[]) => { selectedRoles = roles; };

    const { result } = renderHook(() =>
      useMUATableRolesSelection({
        selectedRoles,
        setSelectedRoles,
        sortedRows: PAGE_1,
      })
    );

    act(() => {
      result.current.onSelect({} as any, true, 0); // select first row on page 1
    });

    expect(selectedRoles).toContain('Role A');
    expect(selectedRoles).not.toContain('Role D');
  });

  it('selects the correct role by rowId on page 2 (pagination bug)', () => {
    let selectedRoles: string[] = ['Role A']; // already selected from page 1
    const setSelectedRoles = (roles: string[]) => { selectedRoles = roles; };

    // Simulate navigating to page 2 — sortedRows is now pagedRows for page 2
    const { result } = renderHook(() =>
      useMUATableRolesSelection({
        selectedRoles,
        setSelectedRoles,
        sortedRows: PAGE_2,
      })
    );

    act(() => {
      result.current.onSelect({} as any, true, 0); // select first row on page 2
    });

    expect(selectedRoles).toContain('Role A'); // page 1 selection preserved
    expect(selectedRoles).toContain('Role D'); // page 2 row 0 correctly identified
    expect(selectedRoles).not.toContain('Role B'); // page 1 row 1 not incorrectly selected
  });

  it('getIsRowSelected returns true for selected roles regardless of page', () => {
    const selectedRoles = ['Role A', 'Role D'];
    const { result } = renderHook(() =>
      useMUATableRolesSelection({
        selectedRoles,
        setSelectedRoles: () => {},
        sortedRows: PAGE_2,
      })
    );

    expect(result.current.getIsRowSelected('Role A')).toBe(true);
    expect(result.current.getIsRowSelected('Role D')).toBe(true);
    expect(result.current.getIsRowSelected('Role B')).toBe(false);
  });

  it('deselects the correct role on page 2', () => {
    let selectedRoles = ['Role A', 'Role D'];
    const setSelectedRoles = (roles: string[]) => { selectedRoles = roles; };

    const { result } = renderHook(() =>
      useMUATableRolesSelection({
        selectedRoles,
        setSelectedRoles,
        sortedRows: PAGE_2,
      })
    );

    act(() => {
      result.current.onSelect({} as any, false, 0); // deselect first row on page 2
    });

    expect(selectedRoles).toContain('Role A');
    expect(selectedRoles).not.toContain('Role D');
  });
});
