import { useEffect, useState } from "react";
import type { TableConnection } from "@unify/table-core";
import { FrontendDuckDB } from "@unify/unify-duckdb-frontend";
import { SEED_SQL } from "../data/sample_data";

import workerPath from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";
import wasmPath from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";

export function useDuckDB() {
  const [db, setDb] = useState<TableConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initTime, setInitTime] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t0 = performance.now();
    (async () => {
      try {
        const db = await FrontendDuckDB.init({ wasmPath, workerPath });
        const conn = await db.connect();
        if (cancelled) return;
        await conn.run(SEED_SQL);
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
