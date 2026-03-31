import * as duckdb from "@duckdb/duckdb-wasm";
import type { TableConnection } from "@unify/table-core";

import workerUrl from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";
import wasmUrl from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";

/** Wrap an AsyncDuckDBConnection as a TableConnection. */
function wrapConnection(conn: duckdb.AsyncDuckDBConnection): TableConnection {
  return {
    async run(query: string): Promise<void> {
      await conn.query(query);
    },

    async runAndRead(query: string): Promise<Record<string, unknown>[]> {
      const table = await conn.query(query);
      return table.toArray().map((row) => row.toJSON());
    },

    async runAndReadParquetBlob(query: string): Promise<Blob> {
      // COPY (...) TO '/dev/stdout' (FORMAT PARQUET) returns arrow batches
      // whose first column contains the raw parquet bytes.
      const table = await conn.query(query);
      const chunks: Uint8Array[] = [];
      for (const batch of table.batches) {
        const col = batch.getChildAt(0);
        if (!col) continue;
        for (let i = 0; i < col.length; i++) {
          const v = col.get(i);
          if (v) chunks.push(v);
        }
      }
      return new Blob(chunks as BlobPart[], { type: "application/octet-stream" });
    },
  };
}

/** Initialise DuckDB-WASM (EH bundle) and return a TableConnection. */
export async function initDuckDB(): Promise<TableConnection> {
  const worker = new Worker(workerUrl, { type: "module" });
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(wasmUrl);
  const conn = await db.connect();
  return wrapConnection(conn);
}
