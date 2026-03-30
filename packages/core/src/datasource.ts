import type { Row, SortDir, SqlFragment } from './types.js';
import type { QueryEngine } from './engine.js';
import type { ViewManager } from './view.js';
import { quoteIdent, toSqlLiteral } from './sql/utils.js';

export interface SortField {
  field: string;
  dir: SortDir;
}

export type FilterExpr = SqlFragment;

export interface GetRowsParams {
  offset: number;
  limit: number;
}

export interface DataPage {
  rows: Row[];
  total: number;
}

type EventType = 'loading' | 'data' | 'error';
type EventHandler = (payload?: unknown) => void;

export interface AggregationDef {
  field: string;
  fn: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface GroupSummary {
  key: Record<string, unknown>;
  count: number;
  aggs: Record<string, unknown>;
}

export interface FetchGroupsOptions {
  /** Which depth level to fetch (0 = top-level). Defaults to groupBy.length - 1 (flat). */
  depth?: number;
  /** Ancestor key values that constrain this level, e.g. { Region: 'US' } when fetching depth-1 sub-groups. */
  ancestorKeys?: Record<string, unknown>;
}

export interface DataSource {
  /** Fetch a page of rows with current sort/filter/group applied. */
  fetch(params: GetRowsParams): Promise<DataPage>;

  /** Fetch group summaries when groupBy is active, with optional aggregations. */
  fetchGroups(params: GetRowsParams, aggregations?: AggregationDef[], options?: FetchGroupsOptions): Promise<{ groups: GroupSummary[]; total: number }>;

  /** Fetch detail rows for a specific group key. */
  fetchGroupDetail(groupKey: Record<string, unknown>, params: GetRowsParams): Promise<DataPage>;

  /** Return the SQL query that would be executed for the current state (for debugging). */
  buildQuery(params?: GetRowsParams): string;

  /** Current state */
  readonly sort: SortField[];
  readonly filters: FilterExpr[];
  readonly groupBy: string[];
  readonly table: string;

  /** The view name when a ViewManager is attached, otherwise null. */
  readonly viewName: string | null;

  /** Mutate state — batched, triggers re-fetch on next microtask. */
  setSort(sort: SortField[]): void;
  setFilters(filters: FilterExpr[]): void;
  setGroupBy(groupBy: string[]): void;

  /** Subscribe to events. Returns unsubscribe function. */
  on(event: EventType, handler: EventHandler): () => void;

  /** Current version — increments on every state change. Useful for cache invalidation. */
  readonly version: number;
}

export interface DataSourceOptions {
  viewManager?: ViewManager;
}

export function createDataSource(engine: QueryEngine, table: string, options?: DataSourceOptions): DataSource {
  let _sort: SortField[] = [];
  let _filters: FilterExpr[] = [];
  let _groupBy: string[] = [];
  let _version = 0;
  let _flushScheduled = false;
  const _viewManager = options?.viewManager ?? null;

  const listeners = new Map<EventType, Set<EventHandler>>();

  function emit(event: EventType, payload?: unknown) {
    listeners.get(event)?.forEach((h) => h(payload));
  }

  /** The table/view name to query FROM. */
  function source(): string {
    return _viewManager ? _viewManager.viewName : table;
  }

  function scheduleFlush() {
    if (!_flushScheduled) {
      _flushScheduled = true;
      queueMicrotask(async () => {
        _flushScheduled = false;
        if (_viewManager) {
          try {
            await _viewManager.sync(_filters, _sort);
          } catch (err) {
            emit('error', err);
            return;
          }
        }
        _version++;
        emit('data');
      });
    }
  }

  function buildWhere(): string {
    if (_filters.length === 0) return '';
    return _filters.map((f) => f.sql).join(' AND ');
  }

  function buildOrderBy(): string {
    if (_sort.length === 0) return '';
    return _sort.map((s) => `${quoteIdent(s.field)} ${s.dir.toUpperCase()}`).join(', ');
  }

  // buildGroupBy intentionally removed — grouping is handled by fetchGroups/fetchGroupDetail, not regular fetch

  // When a ViewManager is active, filters and sort are baked into the view.
  // Query methods use source() which returns the view name, so they don't need
  // to add WHERE/ORDER BY — the view already has them.
  // When no ViewManager, queries are built directly against the raw table as before.

  /** Build WHERE/ORDER BY only when querying direct (no view). */
  function buildWhereDirect(): string {
    if (_viewManager) return ''; // filters are in the view
    return buildWhere();
  }

  function buildOrderByDirect(): string {
    if (_viewManager) return ''; // sort is in the view
    return buildOrderBy();
  }

  return {
    get sort() {
      return _sort;
    },
    get filters() {
      return _filters;
    },
    get groupBy() {
      return _groupBy;
    },
    get table() {
      return table;
    },
    get viewName() {
      return _viewManager?.viewName ?? null;
    },
    get version() {
      return _version;
    },

    setSort(sort: SortField[]) {
      _sort = sort;
      scheduleFlush();
    },
    setFilters(filters: FilterExpr[]) {
      _filters = filters;
      scheduleFlush();
    },
    setGroupBy(groupBy: string[]) {
      _groupBy = groupBy;
      scheduleFlush();
    },

    buildQuery(params: GetRowsParams = { offset: 0, limit: 100 }): string {
      const src = quoteIdent(source());
      const where = buildWhereDirect();
      const orderBy = buildOrderByDirect();

      if (_groupBy.length > 0) {
        const groupCols = _groupBy.map(quoteIdent).join(', ');
        const groupFieldSet = new Set(_groupBy);
        const sortedFields = new Set<string>();
        const groupOrderParts = _sort
          .filter((s) => groupFieldSet.has(s.field))
          .map((s) => { sortedFields.add(s.field); return `${quoteIdent(s.field)} ${s.dir.toUpperCase()}`; });
        // Ensure all groupBy columns are in ORDER BY (default ASC for unsorted ones)
        for (const field of _groupBy) {
          if (!sortedFields.has(field)) groupOrderParts.push(`${quoteIdent(field)} ASC`);
        }
        let sql = `SELECT ${groupCols}, COUNT(*) AS __group_count FROM ${src}`;
        if (where) sql += ` WHERE ${where}`;
        sql += ` GROUP BY ${groupCols}`;
        sql += ` ORDER BY ${groupOrderParts.join(', ')}`;
        sql += ` LIMIT ${params.limit} OFFSET ${params.offset}`;
        return sql;
      }

      let sql = `SELECT * FROM ${src}`;
      if (where) sql += ` WHERE ${where}`;
      if (orderBy) sql += ` ORDER BY ${orderBy}`;
      sql += ` LIMIT ${params.limit} OFFSET ${params.offset}`;
      return sql;
    },

    async fetchGroups(params: GetRowsParams, aggregations?: AggregationDef[], options?: FetchGroupsOptions): Promise<{ groups: GroupSummary[]; total: number }> {
      if (_groupBy.length === 0) return { groups: [], total: 0 };
      emit('loading');
      try {
        const src = quoteIdent(source());
        const baseWhere = buildWhereDirect();

        // Depth-aware: only group by columns up to the requested depth
        const depth = options?.depth ?? _groupBy.length - 1;
        const groupFields = _groupBy.slice(0, depth + 1);
        const groupCols = groupFields.map(quoteIdent).join(', ');

        // Build ancestor key conditions for hierarchical sub-group fetching
        const ancestorConditions = options?.ancestorKeys
          ? Object.entries(options.ancestorKeys)
              .map(([field, value]) => {
                if (value === null || value === undefined) return `${quoteIdent(field)} IS NULL`;
                return `${quoteIdent(field)} = ${toSqlLiteral(value)}`;
              })
              .join(' AND ')
          : '';

        // Combine base WHERE with ancestor conditions
        const where = [baseWhere, ancestorConditions].filter(Boolean).join(' AND ');

        let countSql = `SELECT COUNT(*) AS cnt FROM (SELECT ${groupCols} FROM ${src}`;
        if (where) countSql += ` WHERE ${where}`;
        countSql += ` GROUP BY ${groupCols}) AS __groups`;
        const countRows = await engine.query<{ cnt: number }>(countSql);
        const total = Number(countRows[0]?.cnt ?? 0);

        // Build aggregation columns
        const aggCols = (aggregations ?? [])
          .map((a) => `${a.fn.toUpperCase()}(${quoteIdent(a.field)}) AS ${quoteIdent(`__agg_${a.field}`)}`)
          .join(', ');

        const selectCols = aggCols
          ? `${groupCols}, COUNT(*) AS __group_count, ${aggCols}`
          : `${groupCols}, COUNT(*) AS __group_count`;

        let sql = `SELECT ${selectCols} FROM ${src}`;
        if (where) sql += ` WHERE ${where}`;
        sql += ` GROUP BY ${groupCols}`;

        // Only apply sort fields valid in this GROUP BY context:
        // grouped columns sort directly, aggregated columns sort by their alias
        const groupFieldSet = new Set(groupFields);
        const aggFieldSet = new Set((aggregations ?? []).map((a) => a.field));
        const sortedFields = new Set<string>();
        const groupOrderParts: string[] = _sort
          .map((s) => {
            if (groupFieldSet.has(s.field)) { sortedFields.add(s.field); return `${quoteIdent(s.field)} ${s.dir.toUpperCase()}`; }
            if (aggFieldSet.has(s.field)) { sortedFields.add(s.field); return `${quoteIdent(`__agg_${s.field}`)} ${s.dir.toUpperCase()}`; }
            return null;
          })
          .filter((x): x is string => x !== null);
        // Ensure all groupBy columns are in ORDER BY (default ASC for unsorted ones)
        for (const field of groupFields) {
          if (!sortedFields.has(field)) groupOrderParts.push(`${quoteIdent(field)} ASC`);
        }
        sql += ` ORDER BY ${groupOrderParts.join(', ')}`;

        sql += ` LIMIT ${params.limit} OFFSET ${params.offset}`;

        const rows = await engine.query(sql);
        const groups: GroupSummary[] = rows.map((row) => {
          const key: Record<string, unknown> = {};
          for (const field of groupFields) key[field] = row[field];
          const aggs: Record<string, unknown> = {};
          for (const a of (aggregations ?? [])) {
            aggs[a.field] = row[`__agg_${a.field}`];
          }
          return { key, count: Number(row.__group_count ?? 0), aggs };
        });
        return { groups, total };
      } catch (err) {
        emit('error', err);
        throw err;
      }
    },

    async fetchGroupDetail(groupKey: Record<string, unknown>, params: GetRowsParams): Promise<DataPage> {
      emit('loading');
      try {
        const src = quoteIdent(source());
        const where = buildWhereDirect();
        const orderBy = buildOrderByDirect();

        const keyConditions = Object.entries(groupKey)
          .map(([field, value]) => {
            if (value === null || value === undefined) return `${quoteIdent(field)} IS NULL`;
            return `${quoteIdent(field)} = ${toSqlLiteral(value)}`;
          })
          .join(' AND ');

        const fullWhere = where ? `${keyConditions} AND ${where}` : keyConditions;

        const total = await engine.count(source(), fullWhere);

        let sql = `SELECT * FROM ${src} WHERE ${fullWhere}`;
        if (orderBy) sql += ` ORDER BY ${orderBy}`;
        sql += ` LIMIT ${params.limit} OFFSET ${params.offset}`;

        const rows = await engine.query(sql);
        return { rows, total };
      } catch (err) {
        emit('error', err);
        throw err;
      }
    },

    async fetch(params: GetRowsParams): Promise<DataPage> {
      emit('loading');
      try {
        const src = quoteIdent(source());
        const where = buildWhereDirect();
        const orderBy = buildOrderByDirect();

        // Build count query
        const total = await engine.count(source(), where || undefined);

        // Build data query — skip GROUP BY in regular fetch (grouping is handled by fetchGroups/fetchGroupDetail)
        let sql = `SELECT * FROM ${src}`;
        if (where) sql += ` WHERE ${where}`;
        if (orderBy) sql += ` ORDER BY ${orderBy}`;
        sql += ` LIMIT ${params.limit} OFFSET ${params.offset}`;

        const rows = await engine.query(sql);
        const page: DataPage = { rows, total };
        emit('data', page);
        return page;
      } catch (err) {
        emit('error', err);
        throw err;
      }
    },

    on(event: EventType, handler: EventHandler): () => void {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(handler);
      return () => listeners.get(event)?.delete(handler);
    },
  };
}
