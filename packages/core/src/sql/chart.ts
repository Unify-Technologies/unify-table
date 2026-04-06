import { quoteIdent } from "./utils.js";
import { aggToSql } from "./agg.js";
import type { SqlFragment } from "../types.js";

// ---------------------------------------------------------------------------
// Chart value field
// ---------------------------------------------------------------------------

export interface ValueField {
  field: string;
  agg: "sum" | "avg" | "count" | "min" | "max" | "median" | "count_distinct";
  label?: string;
  format?: string;
  yAxis?: "left" | "right";
}

// ---------------------------------------------------------------------------
// Chart types
// ---------------------------------------------------------------------------

export type ChartType =
  | "bar"
  | "line"
  | "area"
  | "scatter"
  | "pie"
  | "donut"
  | "histogram"
  | "heatmap"
  | "treemap"
  | "funnel";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function aggExpr(vf: ValueField): string {
  return aggToSql(vf.agg, vf.field);
}

function aggAlias(vf: ValueField): string {
  return vf.label ?? `${vf.agg}_${vf.field}`;
}

function whereClause(filters?: SqlFragment[], extra?: string): string {
  const parts: string[] = [];
  if (filters && filters.length > 0) {
    parts.push(...filters.map((f) => f.sql ?? String(f)));
  }
  if (extra) {
    parts.push(extra);
  }
  return parts.length > 0 ? ` WHERE ${parts.join(" AND ")}` : "";
}

function normalizeY(y: ValueField | ValueField[]): ValueField[] {
  return Array.isArray(y) ? y : [y];
}

// ---------------------------------------------------------------------------
// SQL builders
// ---------------------------------------------------------------------------

export interface BarLineSqlOpts {
  table: string;
  x: string;
  y: ValueField[];
  series?: string;
  filters?: SqlFragment[];
  where?: string;
  limit?: number;
  sort?: "asc" | "desc" | "value";
}

/**
 * SQL for bar / line / area / funnel charts.
 * Groups by x (and optionally series), aggregates y fields.
 */
export function barLineSql(opts: BarLineSqlOpts): string {
  const { table, x, y, series, filters, where, limit, sort } = opts;
  const selects: string[] = [quoteIdent(x)];
  const groupBys: string[] = [quoteIdent(x)];

  if (series) {
    selects.push(quoteIdent(series));
    groupBys.push(quoteIdent(series));
  }

  for (const vf of y) {
    selects.push(`${aggExpr(vf)} AS ${quoteIdent(aggAlias(vf))}`);
  }

  let sql = `SELECT ${selects.join(", ")} FROM ${quoteIdent(table)}`;
  sql += whereClause(filters, where);
  sql += ` GROUP BY ${groupBys.join(", ")}`;

  if (sort === "value" && y.length > 0) {
    sql += ` ORDER BY ${quoteIdent(aggAlias(y[0]))} DESC`;
  } else if (sort === "desc") {
    sql += ` ORDER BY ${quoteIdent(x)} DESC`;
  } else {
    sql += ` ORDER BY ${quoteIdent(x)} ASC`;
  }

  if (limit != null && limit > 0) {
    sql += ` LIMIT ${limit}`;
  }

  return sql;
}

export interface PieSqlOpts {
  table: string;
  label: string;
  value: ValueField;
  series?: string;
  filters?: SqlFragment[];
  where?: string;
  limit?: number;
}

/**
 * SQL for pie / donut / treemap charts.
 * Groups by label field (and optionally series), aggregates value field.
 */
export function pieSql(opts: PieSqlOpts): string {
  const { table, label, value, series, filters, where, limit } = opts;
  const selects = [quoteIdent(label)];
  const groupBys = [quoteIdent(label)];

  if (series) {
    selects.push(quoteIdent(series));
    groupBys.push(quoteIdent(series));
  }

  selects.push(`${aggExpr(value)} AS ${quoteIdent(aggAlias(value))}`);

  let sql = `SELECT ${selects.join(", ")} FROM ${quoteIdent(table)}`;
  sql += whereClause(filters, where);
  sql += ` GROUP BY ${groupBys.join(", ")}`;
  sql += ` ORDER BY ${quoteIdent(aggAlias(value))} DESC`;
  if (limit != null && limit > 0) {
    sql += ` LIMIT ${limit}`;
  }
  return sql;
}

export interface ScatterSqlOpts {
  table: string;
  x: string;
  y: string;
  size?: string;
  series?: string;
  filters?: SqlFragment[];
  where?: string;
  limit?: number;
}

/**
 * SQL for scatter charts — raw SELECT (no aggregation).
 */
export function scatterSql(opts: ScatterSqlOpts): string {
  const { table, x, y, size, series, filters, where, limit } = opts;
  const cols = [quoteIdent(x), quoteIdent(y)];
  if (size) cols.push(quoteIdent(size));
  if (series) cols.push(quoteIdent(series));

  let sql = `SELECT ${cols.join(", ")} FROM ${quoteIdent(table)}`;
  sql += whereClause(filters, where);
  sql += ` LIMIT ${limit ?? 5000}`;
  return sql;
}

export interface HistogramSqlOpts {
  table: string;
  field: string;
  bins?: number;
  filters?: SqlFragment[];
  where?: string;
}

/**
 * SQL for histogram — uses DuckDB's width_bucket for binning.
 */
export function histogramSql(opts: HistogramSqlOpts): string {
  const { table, field, bins = 20, filters, where } = opts;
  const qf = quoteIdent(field);
  const qt = quoteIdent(table);
  const wh = whereClause(filters, where);

  return (
    `WITH stats AS (SELECT MIN(${qf}) AS mn, MAX(${qf}) AS mx FROM ${qt}${wh}), ` +
    `binned AS (SELECT width_bucket(${qf}::DOUBLE, stats.mn::DOUBLE, stats.mx::DOUBLE + 1e-9, ${bins}) AS bin, ` +
    `stats.mn, stats.mx FROM ${qt}, stats${wh}) ` +
    `SELECT bin, mn + (mx - mn) * (bin - 1) / ${bins} AS bin_start, ` +
    `mn + (mx - mn) * bin / ${bins} AS bin_end, ` +
    `COUNT(*) AS "count" FROM binned GROUP BY bin, mn, mx ORDER BY bin`
  );
}

export interface HeatmapSqlOpts {
  table: string;
  x: string;
  y: string;
  value: ValueField;
  filters?: SqlFragment[];
  where?: string;
}

/**
 * SQL for heatmap — groups by x and y, aggregates value.
 */
export function heatmapSql(opts: HeatmapSqlOpts): string {
  const { table, x, y, value, filters, where } = opts;
  let sql = `SELECT ${quoteIdent(x)}, ${quoteIdent(y)}, ${aggExpr(value)} AS ${quoteIdent(aggAlias(value))} FROM ${quoteIdent(table)}`;
  sql += whereClause(filters, where);
  sql += ` GROUP BY ${quoteIdent(x)}, ${quoteIdent(y)}`;
  sql += ` ORDER BY ${quoteIdent(x)}, ${quoteIdent(y)}`;
  return sql;
}

// ---------------------------------------------------------------------------
// Unified chart SQL builder (dispatches by chart type)
// ---------------------------------------------------------------------------

export interface ChartSqlConfig {
  type: ChartType;
  x: string;
  y: ValueField | ValueField[];
  series?: string;
  size?: ValueField;
  filters?: SqlFragment[];
  where?: string;
  limit?: number;
  sort?: "asc" | "desc" | "value";
}

/**
 * Build chart SQL for any chart type, targeting the given view/table.
 */
export function buildChartSql(table: string, config: ChartSqlConfig): string {
  const { type, x, y, series, size, filters, where, limit, sort } = config;
  const yArr = normalizeY(y);

  switch (type) {
    case "bar":
    case "line":
    case "area":
    case "funnel":
      return barLineSql({ table, x, y: yArr, series, filters, where, limit, sort });

    case "pie":
    case "donut":
    case "treemap":
      return pieSql({ table, label: x, value: yArr[0], series, filters, where, limit });

    case "scatter":
      return scatterSql({
        table,
        x,
        y: yArr[0]?.field ?? x,
        size: size?.field,
        series,
        filters,
        where,
        limit: limit ?? 5000,
      });

    case "histogram":
      return histogramSql({ table, field: x, bins: limit ?? 20, filters, where });

    case "heatmap":
      return heatmapSql({
        table,
        x,
        y: series ?? yArr[0]?.field ?? x,
        value: yArr[0],
        filters,
        where,
      });

    default:
      throw new Error(`Unknown chart type: ${type}`);
  }
}

// Re-export helpers
export { normalizeY, aggAlias, aggExpr };
