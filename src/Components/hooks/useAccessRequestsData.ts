import React from 'react';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import apiInstance from '../../Helpers/apiInstance';

// Global variable declaration
declare const API_BASE: string;

interface AccessRequestData {
  request_id: string;
  target_org: string;
  first_name: string;
  last_name: string;
  start_date: string;
  end_date: string;
  created: string;
  status: string;

  [key: string]: any;
}

interface ApiResponse {
  data: AccessRequestData[];
  meta: {
    count: number;
    [key: string]: any;
  };
}

interface UseAccessRequestsDataProps {
  isInternal: boolean;
  page: number;
  perPage: number;
  activeSortIndex: number;
  activeSortDirection: 'asc' | 'desc';
  orgIdFilter: string;
  statusSelections: string[];
  columns: string[];
}

interface UseAccessRequestsDataReturn {
  isLoading: boolean;
  numRows: number;
  rows: string[][];
  fetchAccessRequests: () => void;
  error: string | null;
}

export const useAccessRequestsData = ({
  isInternal,
  page,
  perPage,
  activeSortIndex,
  activeSortDirection,
  orgIdFilter,
  statusSelections,
  columns,
}: UseAccessRequestsDataProps): UseAccessRequestsDataReturn => {
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [numRows, setNumRows] = React.useState<number>(0);
  const [rows, setRows] = React.useState<string[][]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const addNotification = useAddNotification();

  const fetchAccessRequests = React.useCallback(() => {
    setIsLoading(true);
    setError(null);

    const listUrl = new URL(
      `${window.location.origin}${API_BASE}/cross-account-requests/`
    );

    // Determine query type based on user context
    listUrl.searchParams.append(
      'query_by',
      isInternal ? 'user_id' : 'target_org'
    );

    // Pagination parameters
    listUrl.searchParams.append('offset', String((page - 1) * perPage));
    listUrl.searchParams.append('limit', String(perPage));

    // Filter parameters
    if (orgIdFilter) {
      listUrl.searchParams.append('org_id', orgIdFilter);
    }
    if (statusSelections.length > 0) {
      listUrl.searchParams.append('status', statusSelections.join(','));
    }

    // Sorting parameters
    const sortColumnName = columns[activeSortIndex]
      .toLowerCase()
      .replace(' ', '_');
    const orderBy = `${
      activeSortDirection === 'desc' ? '-' : ''
    }${sortColumnName}`;
    listUrl.searchParams.append('order_by', orderBy);

    apiInstance
      .get(listUrl.href, { headers: { Accept: 'application/json' } })
      .then((res: any) => {
        // responseDataInterceptor returns data directly
        const apiResponse = res as ApiResponse;
        setNumRows(apiResponse.meta.count);

        // Transform data to row format for table display
        const transformedRows = apiResponse.data.map((d) =>
          isInternal
            ? [
                d.request_id,
                d.target_org,
                `${d.first_name || ''}${d.last_name ? ' ' : ''}${
                  d.last_name || ''
                }`.trim(),
                d.start_date,
                d.end_date,
                d.created,
                d.status,
              ]
            : [
                d.request_id,
                d.first_name,
                d.last_name,
                d.start_date,
                d.end_date,
                d.created,
                d.status,
              ]
        );

        setRows(transformedRows);
        setIsLoading(false);
      })
      .catch((error: Error) => {
        console.error('Failed to load requests:', error);
        setError(error.message);
        setIsLoading(false);

        addNotification({
          variant: 'danger',
          title: 'Could not load access requests',
          description: error.message,
        });
      });
  }, [
    isInternal,
    page,
    perPage,
    activeSortIndex,
    activeSortDirection,
    orgIdFilter,
    statusSelections,
    columns,
    addNotification,
  ]);

  return {
    isLoading,
    numRows,
    rows,
    fetchAccessRequests,
    error,
  };
};
