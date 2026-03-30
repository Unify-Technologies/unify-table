import type { ColumnType, Row } from './types.js';
import { quoteIdent, escapeString } from './sql/utils.js';

/**
 * Minimal connection interface — compatible with IDuckDBConnection from @unify/unify-duckdb-common.
 * Kept generic so table-core has zero external dependencies.
 */
export interface TableConnection {
  run(query: string): Promise<void>;
  runAndRead(query: string): Promise<Record<string, unknown>[]>;
  runAndReadParquetBlob(query: string): Promise<Blob>;
}

export interface ColumnInfo {
  name: string;
  type: string;
  mappedType: ColumnType;
  nullable: boolean;
}

export interface QueryEngine {
  /** Run a SELECT and return rows as JS objects. */
  query<T = Row>(sql: string): Promise<T[]>;
  /** Run a statement without returning results (DDL, DML). */
  execute(sql: string): Promise<void>;
  /** Get column metadata for a table. */
  columns(table: string): Promise<ColumnInfo[]>;
  /** Count rows, optionally with a WHERE clause. */
  count(table: string, where?: string): Promise<number>;
  /** Get distinct values for a column (for filter dropdowns). */
  distinct(table: string, column: string, limit?: number): Promise<unknown[]>;
  /** Export a table as a Blob in the given format. */
  exportBlob(table: string, format: 'csv' | 'parquet' | 'json'): Promise<Blob>;
}

/** Map DuckDB type strings to our broad ColumnType categories. */
function mapDuckDBType(duckdbType: string): ColumnType {
  const t = duckdbType.toUpperCase();
  if (t.includes('BIGINT') || t.includes('HUGEINT')) return 'bigint';
  if (t.includes('INT') || t.includes('FLOAT') || t.includes('DOUBLE') || t.includes('DECIMAL') || t.includes('NUMERIC'))
    return 'number';
  if (t === 'BOOLEAN' || t === 'BOOL') return 'boolean';
  if (t === 'DATE') return 'date';
  if (t.includes('TIMESTAMP') || t.includes('TIME')) return 'timestamp';
  if (t === 'BLOB' || t === 'BYTEA') return 'blob';
  if (t.startsWith('STRUCT')) return 'struct';
  if (t.startsWith('MAP') || t.endsWith('[]') || t.startsWith('LIST')) return 'list';
  if (t.startsWith('ENUM')) return 'enum';
  if (t === 'VARCHAR' || t === 'TEXT' || t === 'STRING' || t.startsWith('CHAR')) return 'string';
  return 'unknown';
}

/** Create a QueryEngine from a DuckDB connection (or any TableConnection-compatible object). */
export function createQueryEngine(connection: TableConnection): QueryEngine {
  return {
    async query<T = Row>(sql: string): Promise<T[]> {
      return (await connection.runAndRead(sql)) as T[];
    },

    async execute(sql: string): Promise<void> {
      await connection.run(sql);
    },

    async columns(table: string): Promise<ColumnInfo[]> {
      const rows = await connection.runAndRead(
        `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = ${escapeString(table)}`
      );
      return rows.map((r) => ({
        name: r.column_name as string,
        type: r.data_type as string,
        mappedType: mapDuckDBType(r.data_type as string),
        nullable: (r.is_nullable as string) === 'YES',
      }));
    },

    async count(table: string, where?: string): Promise<number> {
      const qt = quoteIdent(table);
      const sql = where
        ? `SELECT COUNT(*) AS cnt FROM ${qt} WHERE ${where}`
        : `SELECT COUNT(*) AS cnt FROM ${qt}`;
      const rows = await connection.runAndRead(sql);
      return Number(rows[0]?.cnt ?? 0);
    },

    async distinct(table: string, column: string, limit = 50): Promise<unknown[]> {
      const rows = await connection.runAndRead(
        `SELECT DISTINCT ${quoteIdent(column)} AS val FROM ${quoteIdent(table)} ORDER BY val LIMIT ${limit}`
      );
      return rows.map((r) => r.val);
    },

    async exportBlob(table: string, format: 'csv' | 'parquet' | 'json'): Promise<Blob> {
      return connection.runAndReadParquetBlob(
        `COPY (SELECT * FROM ${quoteIdent(table)}) TO '/dev/stdout' (FORMAT ${format})`
      );
    },
  };
}
