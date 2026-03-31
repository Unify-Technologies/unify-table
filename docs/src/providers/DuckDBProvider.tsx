import { createContext, useContext, type ReactNode } from "react";
import type { TableConnection } from "@unify/table-core";
import { useDuckDB } from "./useDuckDB";

interface DuckDBContextValue {
  db: TableConnection | null;
  isReady: boolean;
  error: string | null;
  initTime: number | null;
}

const DuckDBContext = createContext<DuckDBContextValue>({
  db: null,
  isReady: false,
  error: null,
  initTime: null,
});

export function DuckDBProvider({ children }: { children: ReactNode }) {
  const { db, error, initTime } = useDuckDB();
  return (
    <DuckDBContext.Provider value={{ db, isReady: !!db, error, initTime }}>
      {children}
    </DuckDBContext.Provider>
  );
}

export function useDB() {
  return useContext(DuckDBContext);
}
