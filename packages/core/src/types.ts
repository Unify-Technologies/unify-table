/** DuckDB column types mapped to broad categories */
export type ColumnType =
  | 'string'
  | 'number'
  | 'bigint'
  | 'boolean'
  | 'date'
  | 'timestamp'
  | 'blob'
  | 'list'
  | 'struct'
  | 'enum'
  | 'unknown';

export type SortDir = 'asc' | 'desc';

export type AggFn = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'count_distinct' | (string & {});

export type Row = Record<string, unknown>;

/** A raw SQL fragment — produced by filter/select functions */
export interface SqlFragment {
  sql: string;
  toString(): string;
}
