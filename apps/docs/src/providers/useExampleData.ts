import { useEffect, useRef, useState } from "react";
import type { TableConnection } from "@unify/table-core";

/** Track which seed SQLs have already been executed globally. */
const executedSeeds = new Set<string>();

/**
 * Runs a seed SQL idempotently against the shared DuckDB connection.
 * Returns true once the data is ready.
 */
export function useExampleData(db: TableConnection | null, seedSql: string | undefined): boolean {
  const [ready, setReady] = useState(!seedSql);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!db || !seedSql || runningRef.current) return;
    const key = seedSql.slice(0, 120);
    if (executedSeeds.has(key)) {
      setReady(true);
      return;
    }
    runningRef.current = true;
    db.run(seedSql).then(() => {
      executedSeeds.add(key);
      setReady(true);
      runningRef.current = false;
    });
  }, [db, seedSql]);

  return ready;
}
