import { useEffect, useState } from "react";
import type { TableConnection } from "@unify/table-core";
import { FrontendDuckDB } from "@unify/unify-duckdb-frontend";
import { TASKS_SQL, EMPLOYEES_SQL, PRODUCTS_SQL, ORDERS_SQL, TRADES_SAMPLE_SQL } from "../data";

import workerPath from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";
import wasmPath from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";

/** Seed SQL for the lightweight datasets (loaded eagerly). */
const EAGER_SEED = [TASKS_SQL, EMPLOYEES_SQL, PRODUCTS_SQL, ORDERS_SQL, TRADES_SAMPLE_SQL].join("\n");

export function useDuckDB() {
  const [db, setDb] = useState<TableConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initTime, setInitTime] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t0 = performance.now();
    (async () => {
      try {
        const instance = await FrontendDuckDB.init({ wasmPath, workerPath });
        const conn = await instance.connect();
        if (cancelled) return;
        await conn.run(EAGER_SEED);
        setInitTime(Math.round(performance.now() - t0));
        setDb(conn);
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { db, error, initTime };
}
