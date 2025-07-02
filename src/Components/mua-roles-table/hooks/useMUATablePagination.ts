import React from 'react';
import { MUARole } from './useMUATableData';

interface UseMUATablePaginationProps {
  rows: MUARole[];
}

interface UseMUATablePaginationReturn {
  page: number;
  setPage: (page: number) => void;
  perPage: number;
  setPerPage: (perPage: number) => void;
  pagedRows: MUARole[];
  onSetPage: (event: any, pageNumber: number) => void;
  onPerPageSelect: (event: any, perPageValue: number) => void;
}

export const useMUATablePagination = ({
  rows,
}: UseMUATablePaginationProps): UseMUATablePaginationReturn => {
  const [page, setPage] = React.useState<number>(1);
  const [perPage, setPerPage] = React.useState<number>(10);

  const pagedRows = React.useMemo(() => {
    const startIndex = (page - 1) * perPage;
    const endIndex = page * perPage;
    return rows.slice(startIndex, endIndex);
  }, [rows, page, perPage]);

  const onSetPage = React.useCallback((_event: any, pageNumber: number) => {
    setPage(pageNumber);
  }, []);

  const onPerPageSelect = React.useCallback(
    (_event: any, perPageValue: number) => {
      setPage(1); // Reset to first page when changing per page
      setPerPage(perPageValue);
    },
    []
  );

  // Reset to first page when rows change (due to filtering)
  React.useEffect(() => {
    setPage(1);
  }, [rows.length]);

  return {
    page,
    setPage,
    perPage,
    setPerPage,
    pagedRows,
    onSetPage,
    onPerPageSelect,
  };
};
