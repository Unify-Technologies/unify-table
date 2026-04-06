import type { QueryEngine } from "./engine.js";
import type { SqlFragment, SortDir } from "./types.js";
import { quoteIdent } from "./sql/utils.js";

export interface SortSpec {
  field: string;
  dir: SortDir;
}

export interface SelectExpression {
  expression: string;
  alias: string;
}

export interface ViewManager {
  /** The DuckDB view name, e.g. "__utbl_v_0" */
  readonly viewName: string;
  /** The full CREATE OR REPLACE VIEW SQL last executed */
  readonly viewSql: string;
  /** Change the base table used in view creation (e.g. to an edit overlay view). */
  setBaseTable(table: string): void;
  /** Set extra computed columns to include in the SELECT (e.g. formula expressions). */
  setSelectExpressions(exprs: SelectExpression[]): void;
  /** Recreate the VIEW from the given filters and sort. */
  sync(filters: SqlFragment[], sort: SortSpec[]): Promise<void>;
  /** Drop the VIEW (cleanup). */
  drop(): Promise<void>;
}

/**
 * Build the SELECT body for the view (no CREATE VIEW wrapper).
 * Exported for testing.
 */
export function buildViewSelect(
  table: string,
  filters: SqlFragment[],
  sort: SortSpec[],
  extraExpressions?: SelectExpression[],
): string {
  const extras = (extraExpressions ?? [])
    .map((e) => `(${e.expression}) AS ${quoteIdent(e.alias)}`)
    .join(", ");
  const selectList = extras ? `*, ${extras}` : "*";
  let sql = `SELECT ${selectList} FROM ${quoteIdent(table)}`;

  if (filters.length > 0) {
    sql += ` WHERE ${filters.map((f) => f.sql).join(" AND ")}`;
  }

  if (sort.length > 0) {
    sql += ` ORDER BY ${sort.map((s) => `${quoteIdent(s.field)} ${s.dir.toUpperCase()}`).join(", ")}`;
  }

  return sql;
}

/**
 * Create a ViewManager that maintains a DuckDB VIEW reflecting
 * the current DataSource state (filters + sort).
 *
 * The view is non-materialized — queries against it always read
 * from the underlying table. This enables non-destructive editing:
 * writes go to the raw table, the view reflects changes automatically.
 */
export function createViewManager(engine: QueryEngine, table: string, id: string): ViewManager {
  const viewName = `__utbl_v_${id}`;
  let _viewSql = "";
  let _baseTable = table;
  let _extraExpressions: SelectExpression[] = [];

  return {
    get viewName() {
      return viewName;
    },
    get viewSql() {
      return _viewSql;
    },

    setBaseTable(t: string) {
      _baseTable = t;
    },

    setSelectExpressions(exprs: SelectExpression[]) {
      _extraExpressions = exprs;
    },

    async sync(filters, sort) {
      try {
        const body = buildViewSelect(_baseTable, filters, sort, _extraExpressions);
        _viewSql = `CREATE OR REPLACE VIEW ${quoteIdent(viewName)} AS ${body}`;
        await engine.execute(_viewSql);
      } catch (err) {
        const msg = `ViewManager.sync failed for view "${viewName}": ${err instanceof Error ? err.message : err}`;
        throw Object.assign(new Error(msg), { cause: err });
      }
    },

    async drop() {
      try {
        await engine.execute(`DROP VIEW IF EXISTS ${quoteIdent(viewName)}`);
        _viewSql = "";
      } catch (err) {
        const msg = `ViewManager.drop failed for view "${viewName}": ${err instanceof Error ? err.message : err}`;
        throw Object.assign(new Error(msg), { cause: err });
      }
    },
  };
}
