// @unify/table-core — DuckDB-native data engine
// SQL builder, query engine, data source

// SQL builder
export { select, update, insertInto, deleteFrom } from './sql/select.js';
export {
  eq,
  neq,
  gt,
  gte,
  lt,
  lte,
  contains,
  startsWith,
  endsWith,
  oneOf,
  between,
  isNull,
  isNotNull,
  and,
  or,
  not,
  raw,
  parseFilterExpr,
} from './sql/filters.js';
export { sum, avg, count, min, max, countDistinct, first, last, any, mode, stddev, variance, stringAgg, aggToSql, registerAgg, BUILT_IN_AGGS } from './sql/agg.js';
export { quoteIdent, escapeString, toSqlLiteral, isIdentityColumn, pickNumericColumn, pickStringColumn } from './sql/utils.js';

// Engine
export { createQueryEngine } from './engine.js';
export type { QueryEngine, ColumnInfo, TableConnection } from './engine.js';

// DataSource
export { createDataSource } from './datasource.js';
export type { DataSource, DataSourceOptions, DataPage, GetRowsParams, SortField, FilterExpr, GroupSummary, AggregationDef, FetchGroupsOptions } from './datasource.js';

// View
export { createViewManager, buildViewSelect } from './view.js';
export type { ViewManager, SelectExpression } from './view.js';

// Edit overlay
export { createEditOverlay } from './edit_overlay.js';
export type { EditOverlay, DirtyRow } from './edit_overlay.js';

// Display
export { registerDisplayType, getDisplayType, listDisplayTypes, clearDisplayTypes } from './display.js';
export type { DisplayConfig, DisplayType, CardSize } from './display.js';

// Display types — chart
export { chartDisplayType } from './displays/chart.js';
export type { ChartDisplayConfig, ChartType, ValueField, ChartSqlConfig } from './displays/chart.js';

// Display types — stats
export { statsDisplayType } from './displays/stats.js';
export type { StatsDisplayConfig, StatField, StatAgg } from './displays/stats.js';

// Display types — pivot
export { pivotDisplayType } from './displays/pivot.js';
export type { PivotDisplayConfig, PivotAgg } from './displays/pivot.js';

// Display types — summary
export { summaryDisplayType } from './displays/summary.js';
export type { SummaryDisplayConfig } from './displays/summary.js';

// Display types — correlation
export { correlationDisplayType } from './displays/correlation.js';
export type { CorrelationDisplayConfig } from './displays/correlation.js';

// Display types — timeline
export { timelineDisplayType } from './displays/timeline.js';
export type { TimelineDisplayConfig, BucketInterval, TimelineAgg } from './displays/timeline.js';

// Display types — outliers
export { outliersDisplayType } from './displays/outliers.js';
export type { OutliersDisplayConfig, OutlierMethod } from './displays/outliers.js';

// Chart SQL builders
export { barLineSql, pieSql, scatterSql, histogramSql, heatmapSql, buildChartSql } from './sql/chart.js';
export type { BarLineSqlOpts, PieSqlOpts, ScatterSqlOpts, HistogramSqlOpts, HeatmapSqlOpts } from './sql/chart.js';

// Types
export type {
  ColumnType,
  SortDir,
  AggFn,
  Row,
  SqlFragment,
} from './types.js';
