import type { DisplayType } from '../display.js';
import { quoteIdent, pickNumericColumn, pickStringColumn } from '../sql/utils.js';
import { aggToSql } from '../sql/agg.js';

export type PivotAgg = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median' | 'count_distinct';

export interface PivotDisplayConfig {
  rowField: string;
  colField: string;
  valueField: string;
  agg: PivotAgg;
  /** Max distinct column values to include (caps pivot width). Default 50. */
  colLimit: number;
  showRowTotals: boolean;
  showColTotals: boolean;
  rowSort?: 'asc' | 'desc';
}

export const pivotDisplayType: DisplayType<PivotDisplayConfig> = {
  key: 'pivot',
  label: 'Pivot',
  description: 'Cross-tabulation matrix with row and column totals',

  buildSql(viewName, config) {
    const qRow = quoteIdent(config.rowField);
    const qCol = quoteIdent(config.colField);
    const qView = quoteIdent(viewName);
    const aggExpr = aggToSql(config.agg, config.valueField);
    const sortDir = config.rowSort === 'desc' ? 'DESC' : 'ASC';

    // Subquery limits column values to top N by aggregate
    const colSubquery =
      `SELECT ${qCol} FROM ${qView} GROUP BY ${qCol} ` +
      `ORDER BY ${aggExpr} DESC LIMIT ${config.colLimit}`;

    return (
      `SELECT ${qRow} AS "row_val", ${qCol} AS "col_val", ${aggExpr} AS "agg_val" ` +
      `FROM ${qView} ` +
      `WHERE ${qCol} IN (${colSubquery}) ` +
      `GROUP BY ${qRow}, ${qCol} ` +
      `ORDER BY ${qRow} ${sortDir}`
    );
  },

  defaultConfig(columns) {
    const rowField = pickStringColumn(columns);
    return {
      rowField,
      colField: pickStringColumn(columns, rowField),
      valueField: pickNumericColumn(columns),
      agg: 'sum',
      colLimit: 50,
      showRowTotals: true,
      showColTotals: true,
    };
  },

  validate(config) {
    const errors: string[] = [];
    if (!config.rowField) errors.push('Row field is required');
    if (!config.colField) errors.push('Column field is required');
    if (!config.valueField) errors.push('Value field is required');
    if (config.rowField === config.colField) errors.push('Row and column fields must be different');
    if (config.colLimit < 1 || config.colLimit > 500) errors.push('Column limit must be between 1 and 500');
    return errors.length > 0 ? errors : null;
  },
};
