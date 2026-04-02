import type { DisplayType } from '../display.js';
import { quoteIdent, isIdentityColumn, isNumericType } from '../sql/utils.js';

export type OutlierMethod = 'iqr' | 'zscore';

export interface OutliersDisplayConfig {
  /** Numeric column to analyze. */
  field: string;
  /** Detection method. */
  method: OutlierMethod;
  /** For IQR: the multiplier (default 1.5). For z-score: the z threshold (default 3.0). */
  threshold: number;
  /** Optional label column to identify rows in the outlier table. */
  labelField?: string;
  /** Maximum number of outlier rows to return. */
  limit?: number;
}

export const outliersDisplayType: DisplayType<OutliersDisplayConfig> = {
  key: 'outliers',
  label: 'Outliers',
  description: 'Detect outliers with box plot and IQR or z-score',

  buildSql(viewName, config) {
    const qf = quoteIdent(config.field);
    const qt = quoteIdent(viewName);
    const limit = config.limit ?? 100;
    const threshold = config.threshold;

    const labelSelect = config.labelField
      ? `t.${quoteIdent(config.labelField)} AS "label", `
      : '';
    const labelNull = config.labelField ? 'NULL AS "label", ' : '';

    const statsCte =
      `WITH stats AS (` +
      `SELECT AVG(${qf}) AS mu, STDDEV_SAMP(${qf}) AS sigma, ` +
      `MIN(${qf}) AS val_min, MAX(${qf}) AS val_max, ` +
      `PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY ${qf}) AS q1, ` +
      `PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY ${qf}) AS median, ` +
      `PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ${qf}) AS q3 ` +
      `FROM ${qt}` +
      `)`;

    const boundsCte =
      `, bounds AS (SELECT *, q3 - q1 AS iqr, ` +
      `q1 - ${threshold} * (q3 - q1) AS lower_bound, ` +
      `q3 + ${threshold} * (q3 - q1) AS upper_bound ` +
      `FROM stats)`;

    const zscoreExpr = `(t.${qf} - b.mu) / NULLIF(b.sigma, 0)`;

    const selectCols =
      `t.${qf} AS "value", ${labelSelect}` +
      `${zscoreExpr} AS "zscore", ` +
      `b.mu, b.sigma, b.val_min, b.val_max, b.q1, b.median, b.q3, ` +
      `b.iqr, b.lower_bound, b.upper_bound`;

    const sentinelCols =
      `NULL AS "value", ${labelNull}` +
      `NULL AS "zscore", ` +
      `b.mu, b.sigma, b.val_min, b.val_max, b.q1, b.median, b.q3, ` +
      `b.iqr, b.lower_bound, b.upper_bound`;

    const whereClause =
      config.method === 'zscore'
        ? `WHERE ABS(${zscoreExpr}) > ${threshold}`
        : `WHERE t.${qf} < b.lower_bound OR t.${qf} > b.upper_bound`;

    return (
      `${statsCte}${boundsCte} ` +
      `SELECT * FROM (` +
      `SELECT ${selectCols} FROM ${qt} t, bounds b ${whereClause} ` +
      `UNION ALL ` +
      `SELECT ${sentinelCols} FROM bounds b` +
      `) ORDER BY ABS("zscore") DESC NULLS LAST ` +
      `LIMIT ${limit + 1}`
    );
  },

  defaultConfig(columns) {
    const numCol = columns.find(
      (c) => isNumericType(c.mappedType) && !isIdentityColumn(c.name),
    );
    const labelCol = columns.find((c) => c.mappedType === 'string');

    return {
      field: numCol?.name ?? columns[0]?.name ?? '',
      method: 'iqr',
      threshold: 1.5,
      labelField: labelCol?.name,
      limit: 100,
    };
  },

  validate(config) {
    const errors: string[] = [];
    if (!config.field) errors.push('Numeric field is required');
    if (config.threshold <= 0) errors.push('Threshold must be positive');
    return errors.length > 0 ? errors : null;
  },
};
