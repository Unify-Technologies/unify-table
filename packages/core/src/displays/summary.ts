import type { DisplayType, CardSize } from '../display.js';
import { quoteIdent, isIdentityColumn } from '../sql/utils.js';

export interface SummaryDisplayConfig {
  /** Columns to exclude from profiling. Empty = profile all. */
  excludeColumns: string[];
  /** Whether to show distribution mini-histograms (fetched lazily). */
  showDistributions: boolean;
  /** Number of histogram bins for numeric columns. Default 20. */
  histogramBins: number;
  /** Layout: 'grid' for card grid, 'list' for vertical list. */
  layout: 'grid' | 'list';
  /** Card size: 'sm' for compact, 'md' for default, 'lg' for spacious. */
  cardSize?: CardSize;
}

export const summaryDisplayType: DisplayType<SummaryDisplayConfig> = {
  key: 'summary',
  label: 'Summary',
  description: 'Auto-profile every column: distributions, nulls, uniques',

  buildSql(viewName, config, columns) {
    const excluded = config.excludeColumns ?? [];
    const included = columns.filter((c) => !excluded.includes(c.name));
    if (included.length === 0) {
      return `SUMMARIZE SELECT * FROM ${quoteIdent(viewName)}`;
    }
    const cols = included.map((c) => quoteIdent(c.name)).join(', ');
    return `SUMMARIZE SELECT ${cols} FROM ${quoteIdent(viewName)}`;
  },

  defaultConfig(columns) {
    const idCols = columns.filter((c) => isIdentityColumn(c.name)).map((c) => c.name);
    return {
      excludeColumns: idCols,
      showDistributions: true,
      histogramBins: 20,
      layout: 'grid',
      cardSize: 'md',
    };
  },

  validate(config) {
    const errors: string[] = [];
    if (config.histogramBins < 2 || config.histogramBins > 100) {
      errors.push('Histogram bins must be between 2 and 100');
    }
    return errors.length > 0 ? errors : null;
  },
};
