import type { DisplayType, CardSize } from '../display.js';
import type { ColumnInfo } from '../engine.js'; // used in defaultConfig parameter type
import { quoteIdent, isIdentityColumn, isNumericType } from '../sql/utils.js';
import { aggToSql } from '../sql/agg.js';

export type StatAgg = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'median' | 'stddev' | 'count_distinct';

export interface StatField {
  field: string;
  aggs: StatAgg[];
  label?: string;
  format?: string;
  highlight?: 'primary' | 'secondary';
}

export interface StatsDisplayConfig {
  fields: StatField[];
  layout?: 'row' | 'column';
  cardSize?: CardSize;
}

export const statsDisplayType: DisplayType<StatsDisplayConfig> = {
  key: 'stats',
  label: 'Stats',
  description: 'Summary cards with aggregations per column',

  buildSql(viewName, config) {
    const selects: string[] = [];

    for (const f of config.fields) {
      for (const agg of f.aggs) {
        const alias = `${f.field}__${agg}`;
        selects.push(`${aggToSql(agg, f.field)} AS ${quoteIdent(alias)}`);
      }
    }

    if (selects.length === 0) {
      selects.push('1');
    }

    return `SELECT ${selects.join(', ')} FROM ${quoteIdent(viewName)}`;
  },

  defaultConfig(columns) {
    const numericCols = columns.filter(
      (c) => isNumericType(c.mappedType) && !isIdentityColumn(c.name),
    );
    const fields: StatField[] = numericCols.slice(0, 3).map((c) => ({
      field: c.name,
      aggs: ['sum', 'avg', 'min', 'max'] as StatAgg[],
    }));
    return { fields, layout: 'column', cardSize: 'md' };
  },

  validate(config) {
    const errors: string[] = [];
    if (config.fields.length === 0) errors.push('At least one field is required');
    for (const f of config.fields) {
      if (!f.field) errors.push('Field name is required');
      if (f.aggs.length === 0) errors.push(`At least one aggregation is required for ${f.field}`);
    }
    return errors.length > 0 ? errors : null;
  },
};
