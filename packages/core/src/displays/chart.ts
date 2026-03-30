import type { DisplayType } from '../display.js';
import type { ChartSqlConfig, ChartType, ValueField } from '../sql/chart.js';
import { buildChartSql } from '../sql/chart.js';
import { pickNumericColumn, pickStringColumn } from '../sql/utils.js';

export type { ChartType, ValueField, ChartSqlConfig };

export interface ChartDisplayConfig {
  type: ChartType;
  x: string;
  y: ValueField | ValueField[];
  series?: string;
  size?: ValueField;
  limit?: number;
  sort?: 'asc' | 'desc' | 'value';
  // Rendering options (not used by SQL, passed through to the React descriptor)
  title?: string;
  subtitle?: string;
  legend?: boolean | 'top' | 'bottom' | 'left' | 'right';
  stacked?: boolean;
  horizontal?: boolean;
  showValues?: boolean;
  colorScheme?: string[] | 'default' | 'warm' | 'cool' | 'monochrome';
  xAxis?: { label?: string; rotate?: number; format?: string };
  yAxis?: { label?: string; min?: number; max?: number; format?: string };
  yAxisRight?: { label?: string; format?: string };
  zoom?: boolean;
}

export const chartDisplayType: DisplayType<ChartDisplayConfig> = {
  key: 'chart',
  label: 'Chart',
  description: 'Bar, line, pie, scatter and more chart types',

  buildSql(viewName, config, _columns) {
    const sqlConfig: ChartSqlConfig = {
      type: config.type,
      x: config.x,
      y: config.y,
      series: config.series,
      size: config.size,
      limit: config.limit,
      sort: config.sort,
    };
    return buildChartSql(viewName, sqlConfig);
  },

  defaultConfig(columns) {
    return {
      type: 'bar',
      x: pickStringColumn(columns),
      y: { field: pickNumericColumn(columns), agg: 'sum' },
    };
  },

  validate(config) {
    const errors: string[] = [];
    if (!config.x) errors.push('X axis field is required');
    const yArr = Array.isArray(config.y) ? config.y : [config.y];
    if (yArr.length === 0 || !yArr[0]?.field) errors.push('At least one Y axis field is required');
    return errors.length > 0 ? errors : null;
  },
};
