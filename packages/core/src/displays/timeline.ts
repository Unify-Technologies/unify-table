import type { DisplayType } from '../display.js';
import { quoteIdent, isIdentityColumn, isNumericType } from '../sql/utils.js';
import { aggToSql } from '../sql/agg.js';

export type BucketInterval = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
export type TimelineAgg = 'count' | 'sum' | 'avg' | 'min' | 'max';

export interface TimelineDisplayConfig {
  /** The timestamp/date column to bucket on. */
  dateField: string;
  /** Bucketing granularity. */
  bucket: BucketInterval;
  /** Optional numeric column to aggregate (if omitted, counts rows). */
  valueField?: string;
  /** Aggregation for the value field. */
  agg: TimelineAgg;
  /** Optional category column for series grouping. */
  series?: string;
  /** Limit number of buckets returned. */
  limit?: number;
  /** Rendering: 'bar', 'line', or 'area'. */
  chartType?: 'bar' | 'line' | 'area';
  /** Whether to stack series. */
  stacked?: boolean;
  /** Enable zoom. */
  zoom?: boolean;
  /** Color scheme. */
  colorScheme?: string[] | 'default' | 'warm' | 'cool' | 'monochrome';
}

export const timelineDisplayType: DisplayType<TimelineDisplayConfig> = {
  key: 'timeline',
  label: 'Timeline',
  description: 'Time-bucketed event chart by date or timestamp',

  buildSql(viewName, config) {
    const qDate = quoteIdent(config.dateField);
    const qView = quoteIdent(viewName);
    const bucketExpr = `date_trunc('${config.bucket}', ${qDate})`;

    const valueExpr = config.valueField
      ? aggToSql(config.agg, config.valueField)
      : `COUNT(${qDate})`;

    const selects = [`${bucketExpr} AS "bucket"`];
    const groupBys = ['"bucket"'];

    if (config.series) {
      selects.push(quoteIdent(config.series));
      groupBys.push(quoteIdent(config.series));
    }

    selects.push(`${valueExpr} AS "value"`);

    let sql = `SELECT ${selects.join(', ')} FROM ${qView}`;
    sql += ` GROUP BY ${groupBys.join(', ')}`;
    sql += ` ORDER BY "bucket" ASC`;

    if (config.limit && config.limit > 0) {
      sql += ` LIMIT ${config.limit}`;
    }

    return sql;
  },

  defaultConfig(columns) {
    const dateCol = columns.find(
      (c) => c.mappedType === 'timestamp' || c.mappedType === 'date',
    );
    const numCol = columns.find(
      (c) => isNumericType(c.mappedType) && !isIdentityColumn(c.name),
    );

    return {
      dateField: dateCol?.name ?? columns[0]?.name ?? '',
      bucket: 'day',
      agg: numCol ? 'sum' : 'count',
      valueField: numCol?.name,
      chartType: 'bar',
    };
  },

  validate(config) {
    const errors: string[] = [];
    if (!config.dateField) errors.push('Date/timestamp field is required');
    if (!config.bucket) errors.push('Bucket interval is required');
    return errors.length > 0 ? errors : null;
  },
};
