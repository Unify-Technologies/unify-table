import type { FilterExpr } from '@unify/table-core';

export type ChartType =
  | 'bar'
  | 'line'
  | 'area'
  | 'scatter'
  | 'pie'
  | 'donut'
  | 'histogram'
  | 'heatmap'
  | 'treemap'
  | 'funnel';

export interface ValueField {
  field: string;
  agg: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median' | 'count_distinct';
  label?: string;
  format?: string;
  yAxis?: 'left' | 'right';
}

export interface ChartConfig {
  type: ChartType;
  x: string;
  y: ValueField | ValueField[];
  series?: string;
  size?: ValueField;
  filters?: FilterExpr[];
  where?: string;
  limit?: number;
  sort?: 'asc' | 'desc' | 'value';
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
  brush?: boolean;
  onFilter?: (filter: FilterExpr) => void;
}

export interface ChartProps extends ChartConfig {
  db: unknown;
  table: string;
  table_ctx?: unknown; // TableContext — connected mode
  className?: string;
  echartsOption?: (autoOption: Record<string, unknown>) => Record<string, unknown>;
}
