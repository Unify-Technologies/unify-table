import type { DisplayType } from '../display.js';
import type { ColumnInfo } from '../engine.js';
import { quoteIdent, isIdentityColumn, isNumericType } from '../sql/utils.js';

export interface CorrelationDisplayConfig {
  /** Numeric columns to include. Empty = auto-select all numeric columns. */
  selectedColumns: string[];
  /** Maximum columns to auto-include when selectedColumns is empty. Default 20. */
  maxAutoColumns: number;
  /** Threshold for highlighting strong correlations. Default 0.7. */
  highlightThreshold: number;
  /** Show correlation values as text inside cells. Default true. */
  showValues: boolean;
  /** Color scheme: 'diverging' (red-white-blue) or 'sequential' (white-blue). */
  colorScheme: 'diverging' | 'sequential';
}

function resolveColumns(config: CorrelationDisplayConfig, columns: ColumnInfo[]): string[] {
  if ((config.selectedColumns ?? []).length > 0) return config.selectedColumns;
  return columns
    .filter((c) => isNumericType(c.mappedType) && !isIdentityColumn(c.name))
    .slice(0, config.maxAutoColumns)
    .map((c) => c.name);
}

export const correlationDisplayType: DisplayType<CorrelationDisplayConfig> = {
  key: 'correlation',
  label: 'Correlation',
  description: 'Pairwise Pearson correlation heatmap for numeric columns',

  buildSql(viewName, config, columns) {
    const cols = resolveColumns(config, columns);
    const pairs: string[] = [];

    for (let i = 0; i < cols.length; i++) {
      for (let j = i + 1; j < cols.length; j++) {
        const alias = `p_${i}_${j}`;
        pairs.push(
          `CORR(${quoteIdent(cols[i])}, ${quoteIdent(cols[j])}) AS ${quoteIdent(alias)}`,
        );
      }
    }

    if (pairs.length === 0) return `SELECT 1`;

    return `SELECT ${pairs.join(', ')} FROM ${quoteIdent(viewName)}`;
  },

  defaultConfig(columns) {
    const numericCols = columns
      .filter((c) => isNumericType(c.mappedType) && !isIdentityColumn(c.name))
      .slice(0, 20);
    return {
      selectedColumns: numericCols.map((c) => c.name),
      maxAutoColumns: 20,
      highlightThreshold: 0.7,
      showValues: true,
      colorScheme: 'diverging',
    };
  },

  validate(config) {
    const errors: string[] = [];
    const cols = config.selectedColumns ?? [];
    if (cols.length < 2) errors.push('At least 2 numeric columns are required');
    if (cols.length > 100) errors.push('Maximum 100 columns supported');
    if (config.highlightThreshold < 0 || config.highlightThreshold > 1) {
      errors.push('Highlight threshold must be between 0 and 1');
    }
    return errors.length > 0 ? errors : null;
  },
};
