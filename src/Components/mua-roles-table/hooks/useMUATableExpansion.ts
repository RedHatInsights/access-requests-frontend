import React from 'react';
import { MUARole } from './useMUATableData';

interface UseMUATableExpansionProps {
  rows: MUARole[];
  setRows: React.Dispatch<React.SetStateAction<MUARole[]>>;
  fetchRolePermissions: (role: MUARole) => Promise<void>;
}

interface UseMUATableExpansionReturn {
  onExpand: (role: MUARole) => void;
  isRoleExpanded: (role: MUARole) => boolean;
  isLoadingPermissions: (role: MUARole) => boolean;
}

export const useMUATableExpansion = ({
  rows,
  setRows,
  fetchRolePermissions,
}: UseMUATableExpansionProps): UseMUATableExpansionReturn => {
  const [loadingPermissions, setLoadingPermissions] = React.useState<
    Set<string>
  >(new Set());

  const onExpand = React.useCallback(
    async (role: MUARole) => {
      // Toggle expansion state
      const updatedRows = rows.map((r) =>
        r.uuid === role.uuid ? { ...r, isExpanded: !r.isExpanded } : r
      );
      setRows(updatedRows);

      // If expanding and permissions aren't loaded, fetch them
      if (!role.isExpanded && !role.access) {
        setLoadingPermissions((prev) => new Set(prev).add(role.uuid));

        try {
          await fetchRolePermissions(role);
        } catch (error) {
          // Error handling is done in fetchRolePermissions
          console.error(
            'Failed to fetch permissions for role:',
            role.display_name,
            error
          );
        } finally {
          setLoadingPermissions((prev) => {
            const newSet = new Set(prev);
            newSet.delete(role.uuid);
            return newSet;
          });
        }
      }
    },
    [rows, setRows, fetchRolePermissions]
  );

  const isRoleExpanded = React.useCallback((role: MUARole) => {
    return Boolean(role.isExpanded);
  }, []);

  const isLoadingPermissions = React.useCallback(
    (role: MUARole) => {
      return loadingPermissions.has(role.uuid);
    },
    [loadingPermissions]
  );

  return {
    onExpand,
    isRoleExpanded,
    isLoadingPermissions,
  };
};
