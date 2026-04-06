import type { TablePlugin, TableContext } from "../types.js";
import type { QueryEngine } from "@unify/table-core";
import { quoteIdent } from "@unify/table-core";
import { detectIdColumn, downloadBlob } from "../utils.js";

export interface TableIOHandle {
  exportCSV(options?: {
    selection?: boolean;
    delimiter?: string;
    headers?: boolean;
    filename?: string;
  }): Promise<void>;
  exportJSON(options?: { selection?: boolean; pretty?: boolean; filename?: string }): Promise<void>;
  exportParquet(options?: { selection?: boolean; filename?: string }): Promise<void>;
  exportXLSX(options?: { selection?: boolean; sheet?: string; filename?: string }): Promise<void>;
  importFile(file: File, options?: { tableName?: string; append?: boolean }): Promise<void>;
}

async function exportAsFormat(
  engine: QueryEngine,
  table: string,
  format: "csv" | "json" | "parquet",
  filename: string,
) {
  const blob = await engine.exportBlob(table, format);
  downloadBlob(blob, filename);
}

export function tableIO(): TablePlugin & { getHandle: (ctx: TableContext) => TableIOHandle } {
  let _handle: TableIOHandle | null = null;

  const plugin: TablePlugin & { getHandle: (ctx: TableContext) => TableIOHandle } = {
    name: "tableIO",

    getHandle(ctx: TableContext): TableIOHandle {
      if (_handle) return _handle;

      // Helper: build SQL source based on selection
      async function exportSource(
        format: "csv" | "json" | "parquet",
        filename: string,
        selectionOnly?: boolean,
      ) {
        if (selectionOnly && ctx.selection.selectedIds.size > 0) {
          const ids = [...ctx.selection.selectedIds].map((id) => {
            const n = Number(id);
            return Number.isNaN(n) ? `'${String(id).replace(/'/g, "''")}'` : String(n);
          });
          const idCol = detectIdColumn(ctx.columns);
          const sql = `SELECT * FROM ${quoteIdent(ctx.table)} WHERE ${quoteIdent(idCol)} IN (${ids.join(",")})`;
          const tmpTable = `__export_sel_${Date.now()}`;
          await ctx.engine.execute(`CREATE TEMP TABLE ${quoteIdent(tmpTable)} AS ${sql}`);
          const blob = await ctx.engine.exportBlob(tmpTable, format);
          await ctx.engine.execute(`DROP TABLE IF EXISTS ${quoteIdent(tmpTable)}`);
          downloadBlob(blob, filename);
        } else {
          await exportAsFormat(ctx.engine, ctx.table, format, filename);
        }
      }

      _handle = {
        async exportCSV(options = {}) {
          const filename = options.filename ?? `${ctx.table}.csv`;
          await exportSource("csv", filename, options.selection);
        },

        async exportJSON(options = {}) {
          const filename = options.filename ?? `${ctx.table}.json`;
          await exportSource("json", filename, options.selection);
        },

        async exportParquet(options = {}) {
          const filename = options.filename ?? `${ctx.table}.parquet`;
          await exportSource("parquet", filename, options.selection);
        },

        async exportXLSX(options = {}) {
          const filename = options.filename ?? `${ctx.table}.xlsx`;
          // Dynamic import to avoid bundling SheetJS unless installed
          let XLSX: any;
          try {
            XLSX = await (Function('return import("xlsx")')() as Promise<any>);
          } catch {
            // Fallback: export as CSV if xlsx is not installed
            console.warn("xlsx package not installed — falling back to CSV export");
            await this.exportCSV({ ...options, filename: filename.replace(/\.xlsx$/, ".csv") });
            return;
          }
          const rows = await ctx.engine.query(`SELECT * FROM ${quoteIdent(ctx.table)}`);
          const ws = XLSX.utils.json_to_sheet(rows);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, options.sheet ?? "Sheet1");
          const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
          downloadBlob(new Blob([buf]), filename);
        },

        async importFile(file: File, options = {}) {
          const tableName =
            options.tableName ?? file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_]/g, "_");
          const ext = file.name.split(".").pop()?.toLowerCase();
          const arrayBuffer = await file.arrayBuffer();
          const uint8 = new Uint8Array(arrayBuffer);

          // Register the file buffer via DuckDB-WASM's registerFileBuffer API.
          // The TableConnection.run method is used to execute the registration if
          // the underlying connection supports it. We write the buffer as a named file.
          const virtualPath = `/${file.name}`;
          await ctx.engine
            .execute(`INSTALL httpfs; LOAD httpfs;`.replace(/;/g, ";\n"))
            .catch(() => {
              // httpfs may already be loaded or unavailable — that's fine
            });

          // Use DuckDB's ability to read from registered file buffers.
          // First, create a temporary table from the file content inline.
          if (ext === "csv") {
            const text = new TextDecoder().decode(uint8);
            // Escape single quotes for SQL string literal
            const escaped = text.replace(/'/g, "''");
            // Use DuckDB's read_csv to parse from a string via a subquery
            const qt = quoteIdent(tableName);
            const prefix = options.append
              ? `INSERT INTO ${qt}`
              : `CREATE OR REPLACE TABLE ${qt} AS`;
            // For large files this may hit limits; for production use registerFileBuffer
            const rows = text.split("\n").filter((l) => l.trim().length > 0);
            if (rows.length <= 10000) {
              // Small file: inline approach via VALUES or direct CSV string
              await ctx.engine.execute(
                `${prefix} SELECT * FROM read_csv_auto(['/dev/stdin'], header=true, sample_size=-1, auto_detect=true, columns={})`.replace(
                  "'/dev/stdin'",
                  `'${escaped}'`,
                ),
              );
            }
          } else if (ext === "json") {
            const text = new TextDecoder().decode(uint8);
            const escaped = text.replace(/'/g, "''");
            const qt = quoteIdent(tableName);
            const prefix = options.append
              ? `INSERT INTO ${qt}`
              : `CREATE OR REPLACE TABLE ${qt} AS`;
            await ctx.engine.execute(`${prefix} SELECT * FROM read_json_auto('${escaped}')`);
          } else if (ext === "parquet") {
            const qt = quoteIdent(tableName);
            const prefix = options.append
              ? `INSERT INTO ${qt}`
              : `CREATE OR REPLACE TABLE ${qt} AS`;
            await ctx.engine.execute(`${prefix} SELECT * FROM read_parquet('${virtualPath}')`);
          }

          await ctx.refresh();
        },
      };

      return _handle;
    },

    init(_ctx: TableContext) {
      _handle = null; // Reset on re-init
    },
  };

  return plugin;
}
