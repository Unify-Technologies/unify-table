import { useCallback, useEffect, useRef, useState } from 'react';
import type { QueryEngine, Row } from '@unify/table-core';

export interface UseDisplayDataResult {
  rows: Row[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Shared hook for display data fetching.
 * Executes the given SQL via the engine and returns the result rows.
 * Re-fetches automatically when `sql` changes.
 */
export function useDisplayData(sql: string, engine: QueryEngine): UseDisplayDataResult {
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const versionRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!sql) {
      setRows([]);
      return;
    }

    const version = ++versionRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const result = await engine.query(sql);
      // Only update if this is still the latest request
      if (version === versionRef.current) {
        setRows(result);
        setIsLoading(false);
      }
    } catch (err) {
      if (version === versionRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    }
  }, [sql, engine]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { rows, isLoading, error, refresh: fetchData };
}
