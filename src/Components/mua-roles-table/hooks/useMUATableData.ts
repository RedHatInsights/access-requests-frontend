import React from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/redux';
import apiInstance from '../../../Helpers/apiInstance';

// Global variable declaration
declare const API_BASE: string;

interface RolePermission {
  permission: string;
}

interface RoleAccess {
  access: RolePermission[];
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

// Module-level cache to persist data across component re-renders
let rolesCache: MUARole[] = [];
let applicationsCache: string[] = [];

interface UseMUATableDataReturn {
  rows: MUARole[];
  setRows: React.Dispatch<React.SetStateAction<MUARole[]>>;
  applications: string[];
  isLoading: boolean;
  error: string | null;
  fetchRolePermissions: (role: MUARole) => Promise<void>;
}

export const useMUATableData = (): UseMUATableDataReturn => {
  const [rows, setRows] = React.useState<MUARole[]>(Array.from(rolesCache));
  const [applications, setApplications] =
    React.useState<string[]>(applicationsCache);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const dispatch = useDispatch();

  // Initial data fetch
  React.useEffect(() => {
    if (rolesCache.length === 0 || applicationsCache.length === 0) {
      setIsLoading(true);
      setError(null);

      apiInstance
        .get(
          `${API_BASE}/roles/?system=true&limit=9999&order_by=display_name&add_fields=groups_in_count`,
          { headers: { Accept: 'application/json' } }
        )
        .then((response: any) => {
          // responseDataInterceptor returns data directly
          const data = response.data || response;

          const processedRoles: MUARole[] = data.map((role: any) => ({
            ...role,
            isExpanded: false,
            permissions: role.accessCount || 0,
          }));

          // Cache the processed roles
          rolesCache = processedRoles.map((role) => ({ ...role }));
          setRows(processedRoles);

          // Build application filter from data
          const apps = Array.from(
            processedRoles
              .map((role) => role.applications)
              .flat()
              .reduce((acc: Set<string>, cur: string) => {
                acc.add(cur);
                return acc;
              }, new Set<string>())
          ).sort();

          applicationsCache = apps;
          setApplications(apps);
          setIsLoading(false);
        })
        .catch((err: Error) => {
          const errorMessage = err.message || 'Could not fetch roles list';
          setError(errorMessage);
          setIsLoading(false);

          dispatch(
            addNotification({
              variant: 'danger',
              title: 'Could not fetch roles list',
              description: errorMessage,
            })
          );
        });
    }
  }, [dispatch]);

  // Function to fetch permissions for a specific role
  const fetchRolePermissions = React.useCallback(
    async (role: MUARole): Promise<void> => {
      if (role.access) {
        return; // Already loaded
      }

      try {
        const response: RoleAccess = await apiInstance.get(
          `${API_BASE}/roles/${role.uuid}/`,
          { headers: { Accept: 'application/json' } }
        );

        // Process permissions into [application, resource, operation] format
        const processedAccess = response.access.map((a) =>
          a.permission.split(':')
        );

        // Update the role in the current rows
        setRows((currentRows) =>
          currentRows.map((r) =>
            r.uuid === role.uuid ? { ...r, access: processedAccess } : r
          )
        );

        // Update the cache as well
        const cacheIndex = rolesCache.findIndex((r) => r.uuid === role.uuid);
        if (cacheIndex !== -1) {
          rolesCache[cacheIndex] = {
            ...rolesCache[cacheIndex],
            access: processedAccess,
          };
        }
      } catch (err) {
        const error = err as Error;
        dispatch(
          addNotification({
            variant: 'danger',
            title: `Could not fetch permission list for ${
              role.name || role.display_name
            }.`,
            description: error.message,
          })
        );
        throw error;
      }
    },
    [dispatch]
  );

  return {
    rows,
    setRows,
    applications,
    isLoading,
    error,
    fetchRolePermissions,
  };
};
