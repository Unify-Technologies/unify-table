import { useCallback, useEffect, useRef, useState } from "react";
import type { QueryEngine, Row } from "@unify/table-core";

export interface UseDisplayDataResult {
  rows: Row[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

const DISPLAY_DEBOUNCE_MS = 150;

/**
 * Shared hook for display data fetching.
 * Executes the given SQL via the engine and returns the result rows.
 * Re-fetches automatically when `sql` changes (debounced to avoid rapid re-queries).
 */
export function useDisplayData(sql: string, engine: QueryEngine): UseDisplayDataResult {
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const versionRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(fetchData, DISPLAY_DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [fetchData]);

  return { rows, isLoading, error, refresh: fetchData };
}
