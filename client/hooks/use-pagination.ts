import { useState, useCallback, useEffect } from "react";
import { useErrorHandler } from "./use-error-handler";

interface PaginationResponse<T> {
  data: T[];
  page: number;
  hasNext: boolean;
  total?: number;
}

interface UsePaginationOptions<T> {
  fetchFunction: (
    page: number,
    limit: number,
  ) => Promise<PaginationResponse<T>>;
  limit?: number;
  initialPage?: number;
  autoFetch?: boolean;
}

export function usePagination<T extends Record<string, unknown>>(
  options: UsePaginationOptions<T>,
) {
  const {
    fetchFunction,
    limit = 10,
    initialPage = 1,
    autoFetch = true,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const { handleError } = useErrorHandler();

  const fetchData = useCallback(
    async (pageNumber: number) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetchFunction(pageNumber, limit);

        setData(Array.isArray(res.data) ? res.data : []);
        setPage(res.page ?? pageNumber);
        setHasNextPage(Boolean(res.hasNext));
      } catch (err: unknown) {
        setError(err);
        handleError(err, {
          defaultTitle: "Erro ao carregar dados",
          showDetails: false,
        });
      } finally {
        setLoading(false);
      }
    },
    [fetchFunction, limit, handleError],
  );

  const nextPage = useCallback(() => {
    if (hasNextPage && !loading) {
      fetchData(page + 1);
    }
  }, [hasNextPage, loading, page, fetchData]);

  const prevPage = useCallback(() => {
    if (page > 1 && !loading) {
      fetchData(page - 1);
    }
  }, [page, loading, fetchData]);

  const goToPage = useCallback(
    (pageNumber: number) => {
      if (pageNumber >= 1 && !loading) {
        fetchData(pageNumber);
      }
    },
    [loading, fetchData],
  );

  const refresh = useCallback(() => {
    fetchData(page);
  }, [page, fetchData]);

  useEffect(() => {
    if (autoFetch) {
      fetchData(initialPage);
    }
  }, [autoFetch, initialPage, fetchData]);

  return {
    data,
    page,
    hasNextPage,
    loading,
    error,
    nextPage,
    prevPage,
    goToPage,
    refresh,
    fetchData,
  };
}
