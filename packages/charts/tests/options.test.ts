import { describe, it, expect } from 'vitest';
import {
  resolveColors,
  buildBarLineOption,
  buildPieOption,
  buildScatterOption,
  buildHistogramOption,
  buildHeatmapOption,
  buildTreemapOption,
  buildFunnelOption,
  buildOption,
  DARK_CHART_THEME,
} from '../src/options.js';
import type { ChartOptionConfig } from '../src/options.js';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

// Rows use aggAlias keys: aggAlias({ field: 'value', agg: 'sum' }) => 'sum_value'
const SAMPLE_ROWS = [
  { category: 'A', sum_value: 10, series: 'X', size: 5 },
  { category: 'B', sum_value: 20, series: 'X', size: 10 },
  { category: 'C', sum_value: 30, series: 'Y', size: 15 },
  { category: 'D', sum_value: 40, series: 'Y', size: 20 },
  { category: 'E', sum_value: 50, series: 'X', size: 25 },
];
const SINGLE_ROW = [{ category: 'A', sum_value: 10, series: 'X', size: 5 }];
const EMPTY_ROWS: Record<string, unknown>[] = [];

// aggAlias for { field: 'value', agg: 'sum' } => 'sum_value'
const BASE_Y = { field: 'value', agg: 'sum' };

const BAR_CONFIG: ChartOptionConfig = {
  type: 'bar',
  x: 'category',
  y: BASE_Y,
  theme: DARK_CHART_THEME,
};

const LINE_CONFIG: ChartOptionConfig = { ...BAR_CONFIG, type: 'line' };
const AREA_CONFIG: ChartOptionConfig = { ...BAR_CONFIG, type: 'area' };

const PIE_CONFIG: ChartOptionConfig = {
  type: 'pie',
  x: 'category',
  y: BASE_Y,
  theme: DARK_CHART_THEME,
};

const SCATTER_CONFIG: ChartOptionConfig = {
  type: 'scatter',
  x: 'sum_value',
  y: { field: 'size', agg: 'sum' },
  theme: DARK_CHART_THEME,
};

const HISTOGRAM_ROWS = [
  { bin_start: 0, bin_end: 10, count: 5 },
  { bin_start: 10, bin_end: 20, count: 12 },
  { bin_start: 20, bin_end: 30, count: 8 },
];

const HISTOGRAM_CONFIG: ChartOptionConfig = {
  type: 'histogram',
  x: 'bin_start',
  y: { field: 'count', agg: 'sum' },
  theme: DARK_CHART_THEME,
};

const HEATMAP_ROWS = [
  { x_cat: 'A', y_cat: 'P', sum_value: 10 },
  { x_cat: 'A', y_cat: 'Q', sum_value: 20 },
  { x_cat: 'B', y_cat: 'P', sum_value: 30 },
  { x_cat: 'B', y_cat: 'Q', sum_value: 40 },
];

const HEATMAP_CONFIG: ChartOptionConfig = {
  type: 'heatmap',
  x: 'x_cat',
  y: { field: 'value', agg: 'sum' },
  theme: DARK_CHART_THEME,
};

const TREEMAP_CONFIG: ChartOptionConfig = {
  type: 'treemap',
  x: 'category',
  y: BASE_Y,
  theme: DARK_CHART_THEME,
};

const FUNNEL_CONFIG: ChartOptionConfig = {
  type: 'funnel',
  x: 'category',
  y: BASE_Y,
  theme: DARK_CHART_THEME,
};

// Helper to cast option parts for assertions
function asSeries(option: Record<string, unknown>): { type: string; data: unknown[] }[] {
  return option.series as { type: string; data: unknown[] }[];
}

// ---------------------------------------------------------------------------
// resolveColors
// ---------------------------------------------------------------------------

describe('resolveColors', () => {
  it('returns default colors when scheme is undefined', () => {
    const colors = resolveColors(undefined);
    expect(colors).toHaveLength(9);
    expect(colors[0]).toBe('#6b9bd2');
  });

  it('returns default colors for "default"', () => {
    const colors = resolveColors('default');
    expect(colors).toHaveLength(9);
    expect(colors[0]).toBe('#6b9bd2');
  });

  it('returns warm palette', () => {
    const colors = resolveColors('warm');
    expect(colors).toHaveLength(5);
    expect(colors[0]).toBe('#ee6666');
  });

  it('returns cool palette', () => {
    const colors = resolveColors('cool');
    expect(colors).toHaveLength(5);
    expect(colors[0]).toBe('#5470c6');
  });

  it('returns monochrome palette', () => {
    const colors = resolveColors('monochrome');
    expect(colors).toHaveLength(6);
    expect(colors[0]).toBe('#333');
  });

  it('passes through custom array', () => {
    const custom = ['#ff0000', '#00ff00'];
    expect(resolveColors(custom)).toBe(custom);
  });
});

// ---------------------------------------------------------------------------
// buildBarLineOption
// ---------------------------------------------------------------------------

describe('buildBarLineOption', () => {
  it('builds a basic bar chart', () => {
    const opt = buildBarLineOption(SAMPLE_ROWS, BAR_CONFIG) as Record<string, unknown>;
    expect(opt.backgroundColor).toBe('transparent');
    const series = asSeries(opt);
    expect(series).toHaveLength(1);
    expect(series[0].type).toBe('bar');
    expect(series[0].data).toEqual([10, 20, 30, 40, 50]);
  });

  it('builds a line chart', () => {
    const opt = buildBarLineOption(SAMPLE_ROWS, LINE_CONFIG) as Record<string, unknown>;
    const series = asSeries(opt);
    expect(series[0].type).toBe('line');
  });

  it('builds an area chart (line with areaStyle)', () => {
    const opt = buildBarLineOption(SAMPLE_ROWS, AREA_CONFIG) as Record<string, unknown>;
    const series = asSeries(opt);
    expect(series[0].type).toBe('line');
    expect((series[0] as Record<string, unknown>).areaStyle).toEqual({});
  });

  it('supports stacked mode', () => {
    const config: ChartOptionConfig = { ...BAR_CONFIG, stacked: true };
    const opt = buildBarLineOption(SAMPLE_ROWS, config) as Record<string, unknown>;
    const series = asSeries(opt);
    expect((series[0] as Record<string, unknown>).stack).toBe('total');
  });

  it('supports horizontal mode', () => {
    const config: ChartOptionConfig = { ...BAR_CONFIG, horizontal: true };
    const opt = buildBarLineOption(SAMPLE_ROWS, config) as Record<string, unknown>;
    // In horizontal mode xAxis is value, yAxis is category
    const xAxis = opt.xAxis as Record<string, unknown>;
    const yAxis = opt.yAxis as Record<string, unknown>;
    expect(xAxis.type).toBe('value');
    expect(yAxis.type).toBe('category');
  });

  it('supports multiple y-value fields', () => {
    const rows = [
      { category: 'A', sum_value: 10, avg_value: 5 },
      { category: 'B', sum_value: 20, avg_value: 15 },
    ];
    const config: ChartOptionConfig = {
      ...BAR_CONFIG,
      y: [
        { field: 'value', agg: 'sum' },
        { field: 'value', agg: 'avg' },
      ],
    };
    const opt = buildBarLineOption(rows, config) as Record<string, unknown>;
    const series = asSeries(opt);
    expect(series).toHaveLength(2);
    expect(series[0].data).toEqual([10, 20]);
    expect(series[1].data).toEqual([5, 15]);
  });

  it('supports series grouping', () => {
    const config: ChartOptionConfig = { ...BAR_CONFIG, series: 'series' };
    const opt = buildBarLineOption(SAMPLE_ROWS, config) as Record<string, unknown>;
    const series = asSeries(opt);
    // Two unique series values: 'X' and 'Y'
    expect(series).toHaveLength(2);
    const names = series.map((s) => (s as Record<string, unknown>).name);
    expect(names).toContain('X');
    expect(names).toContain('Y');
  });

  it('handles empty rows without crashing', () => {
    const opt = buildBarLineOption(EMPTY_ROWS, BAR_CONFIG) as Record<string, unknown>;
    const series = asSeries(opt);
    expect(series[0].data).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildPieOption
// ---------------------------------------------------------------------------

describe('buildPieOption', () => {
  it('builds a simple pie chart', () => {
    const opt = buildPieOption(SAMPLE_ROWS, PIE_CONFIG) as Record<string, unknown>;
    expect(opt.backgroundColor).toBe('transparent');
    const series = asSeries(opt);
    expect(series).toHaveLength(1);
    expect(series[0].type).toBe('pie');
    expect(series[0].data).toHaveLength(5);
    expect((series[0].data[0] as Record<string, unknown>).name).toBe('A');
    expect((series[0].data[0] as Record<string, unknown>).value).toBe(10);
  });

  it('builds a donut chart with inner radius', () => {
    const config: ChartOptionConfig = { ...PIE_CONFIG, type: 'donut' };
    const opt = buildPieOption(SAMPLE_ROWS, config) as Record<string, unknown>;
    const series = asSeries(opt);
    const radius = (series[0] as Record<string, unknown>).radius as string[];
    expect(Array.isArray(radius)).toBe(true);
    expect(radius[0]).toBe('40%');
    expect(radius[1]).toBe('70%');
  });

  it('builds nested rings when series is set', () => {
    const config: ChartOptionConfig = { ...PIE_CONFIG, series: 'series' };
    const opt = buildPieOption(SAMPLE_ROWS, config) as Record<string, unknown>;
    const series = asSeries(opt);
    // Inner ring + outer ring
    expect(series).toHaveLength(2);
    expect(series[0].type).toBe('pie');
    expect(series[1].type).toBe('pie');
    // Inner data has unique categories
    const innerNames = (series[0].data as { name: string }[]).map((d) => d.name);
    expect(innerNames).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('handles empty rows', () => {
    const opt = buildPieOption(EMPTY_ROWS, PIE_CONFIG) as Record<string, unknown>;
    const series = asSeries(opt);
    expect(series[0].data).toEqual([]);
  });

  it('omits legend when legend is false', () => {
    const config: ChartOptionConfig = { ...PIE_CONFIG, legend: false };
    const opt = buildPieOption(SAMPLE_ROWS, config) as Record<string, unknown>;
    expect(opt.legend).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// buildScatterOption
// ---------------------------------------------------------------------------

describe('buildScatterOption', () => {
  it('builds a basic scatter chart', () => {
    const opt = buildScatterOption(SAMPLE_ROWS, SCATTER_CONFIG) as Record<string, unknown>;
    expect(opt.backgroundColor).toBe('transparent');
    const series = asSeries(opt);
    expect(series).toHaveLength(1);
    expect(series[0].type).toBe('scatter');
    // Data should be [x, y] tuples
    expect(series[0].data).toHaveLength(5);
  });

  it('includes size dimension when size field is set', () => {
    const rows = [
      { x: 10, y: 20, sz: 5 },
      { x: 30, y: 40, sz: 15 },
    ];
    const config: ChartOptionConfig = {
      type: 'scatter',
      x: 'x',
      y: { field: 'y', agg: 'sum' },
      size: { field: 'sz', agg: 'sum' },
      theme: DARK_CHART_THEME,
    };
    const opt = buildScatterOption(rows, config) as Record<string, unknown>;
    const series = asSeries(opt);
    const firstPoint = series[0].data[0] as number[];
    // Point should have 3 dimensions: [x, y, size]
    expect(firstPoint).toHaveLength(3);
    expect(firstPoint[2]).toBe(5);
  });

  it('groups by series field', () => {
    const config: ChartOptionConfig = { ...SCATTER_CONFIG, series: 'series' };
    const opt = buildScatterOption(SAMPLE_ROWS, config) as Record<string, unknown>;
    const series = asSeries(opt);
    expect(series).toHaveLength(2);
    const names = series.map((s) => (s as Record<string, unknown>).name);
    expect(names).toContain('X');
    expect(names).toContain('Y');
  });

  it('handles empty rows', () => {
    const opt = buildScatterOption(EMPTY_ROWS, SCATTER_CONFIG) as Record<string, unknown>;
    const series = asSeries(opt);
    expect(series[0].data).toEqual([]);
  });

  it('coerces missing x/y values to 0', () => {
    const rows = [{ sum_value: undefined, size: undefined, series: 'X' }];
    const opt = buildScatterOption(rows, SCATTER_CONFIG) as Record<string, unknown>;
    const series = asSeries(opt);
    const point = series[0].data[0] as number[];
    expect(point[0]).toBe(0);
    expect(point[1]).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// buildHistogramOption
// ---------------------------------------------------------------------------

describe('buildHistogramOption', () => {
  it('builds histogram with bin labels', () => {
    const opt = buildHistogramOption(HISTOGRAM_ROWS, HISTOGRAM_CONFIG) as Record<string, unknown>;
    expect(opt.backgroundColor).toBe('transparent');
    const series = asSeries(opt);
    expect(series).toHaveLength(1);
    expect(series[0].type).toBe('bar');
    expect(series[0].data).toEqual([5, 12, 8]);
    // xAxis categories should be formatted bin ranges
    const xAxis = opt.xAxis as Record<string, unknown>;
    const cats = xAxis.data as string[];
    expect(cats).toHaveLength(3);
    // Each category is "start–end" using toPrecision(3)
    expect(cats[0]).toContain('0.00');
    expect(cats[0]).toContain('10.0');
  });

  it('handles empty rows', () => {
    const opt = buildHistogramOption(EMPTY_ROWS, HISTOGRAM_CONFIG) as Record<string, unknown>;
    const series = asSeries(opt);
    expect(series[0].data).toEqual([]);
  });

  it('works with a single bin', () => {
    const rows = [{ bin_start: 0, bin_end: 100, count: 42 }];
    const opt = buildHistogramOption(rows, HISTOGRAM_CONFIG) as Record<string, unknown>;
    const series = asSeries(opt);
    expect(series[0].data).toEqual([42]);
    const xAxis = opt.xAxis as Record<string, unknown>;
    expect((xAxis.data as string[])).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// buildHeatmapOption
// ---------------------------------------------------------------------------

describe('buildHeatmapOption', () => {
  it('builds a normal heatmap', () => {
    const opt = buildHeatmapOption(HEATMAP_ROWS, HEATMAP_CONFIG) as Record<string, unknown>;
    expect(opt.backgroundColor).toBe('transparent');
    const series = asSeries(opt);
    expect(series).toHaveLength(1);
    expect(series[0].type).toBe('heatmap');
    // Data should be [xIdx, yIdx, value] triples
    expect(series[0].data).toHaveLength(4);
    const firstPoint = series[0].data[0] as number[];
    expect(firstPoint).toHaveLength(3);
    // Check visualMap range
    const vm = opt.visualMap as Record<string, unknown>;
    expect(vm.min).toBe(10);
    expect(vm.max).toBe(40);
  });

  it('handles empty rows (Math.min/max edge case with Infinity)', () => {
    // When rows are empty, data is [], Math.min(...[]) = Infinity, Math.max(...[]) = -Infinity
    // This is a known edge case — the builder does not crash but visualMap min/max are inverted
    const opt = buildHeatmapOption(EMPTY_ROWS, HEATMAP_CONFIG) as Record<string, unknown>;
    const series = asSeries(opt);
    expect(series[0].data).toEqual([]);
    const vm = opt.visualMap as Record<string, unknown>;
    expect(vm.min).toBe(Infinity);
    expect(vm.max).toBe(-Infinity);
  });

  it('shows value labels when showValues is true', () => {
    const config: ChartOptionConfig = { ...HEATMAP_CONFIG, showValues: true };
    const opt = buildHeatmapOption(HEATMAP_ROWS, config) as Record<string, unknown>;
    const series = asSeries(opt);
    const label = (series[0] as Record<string, unknown>).label as Record<string, unknown>;
    expect(label.show).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildTreemapOption
// ---------------------------------------------------------------------------

describe('buildTreemapOption', () => {
  it('builds a normal treemap', () => {
    const opt = buildTreemapOption(SAMPLE_ROWS, TREEMAP_CONFIG) as Record<string, unknown>;
    expect(opt.backgroundColor).toBe('transparent');
    const series = asSeries(opt);
    expect(series).toHaveLength(1);
    expect(series[0].type).toBe('treemap');
    expect(series[0].data).toHaveLength(5);
    expect((series[0].data[0] as Record<string, unknown>).name).toBe('A');
    expect((series[0].data[0] as Record<string, unknown>).value).toBe(10);
  });

  it('handles empty rows', () => {
    const opt = buildTreemapOption(EMPTY_ROWS, TREEMAP_CONFIG) as Record<string, unknown>;
    const series = asSeries(opt);
    expect(series[0].data).toEqual([]);
  });

  it('works with a single row', () => {
    const opt = buildTreemapOption(SINGLE_ROW, TREEMAP_CONFIG) as Record<string, unknown>;
    const series = asSeries(opt);
    expect(series[0].data).toHaveLength(1);
    expect((series[0].data[0] as Record<string, unknown>).name).toBe('A');
  });
});

// ---------------------------------------------------------------------------
// buildFunnelOption
// ---------------------------------------------------------------------------

describe('buildFunnelOption', () => {
  it('builds a normal funnel chart', () => {
    const opt = buildFunnelOption(SAMPLE_ROWS, FUNNEL_CONFIG) as Record<string, unknown>;
    expect(opt.backgroundColor).toBe('transparent');
    const series = asSeries(opt);
    expect(series).toHaveLength(1);
    expect(series[0].type).toBe('funnel');
    expect(series[0].data).toHaveLength(5);
  });

  it('handles empty rows', () => {
    const opt = buildFunnelOption(EMPTY_ROWS, FUNNEL_CONFIG) as Record<string, unknown>;
    const series = asSeries(opt);
    expect(series[0].data).toEqual([]);
  });

  it('includes legend by default', () => {
    const opt = buildFunnelOption(SAMPLE_ROWS, FUNNEL_CONFIG) as Record<string, unknown>;
    const legend = opt.legend as Record<string, unknown>;
    expect(legend.show).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildOption (dispatch)
// ---------------------------------------------------------------------------

describe('buildOption', () => {
  it('dispatches bar to buildBarLineOption', () => {
    const opt = buildOption(SAMPLE_ROWS, BAR_CONFIG) as Record<string, unknown>;
    const series = asSeries(opt);
    expect(series[0].type).toBe('bar');
  });

  it('dispatches line to buildBarLineOption', () => {
    const opt = buildOption(SAMPLE_ROWS, LINE_CONFIG) as Record<string, unknown>;
    const series = asSeries(opt);
    expect(series[0].type).toBe('line');
  });

  it('dispatches area to buildBarLineOption', () => {
    const opt = buildOption(SAMPLE_ROWS, AREA_CONFIG) as Record<string, unknown>;
    const series = asSeries(opt);
    expect(series[0].type).toBe('line');
    expect((series[0] as Record<string, unknown>).areaStyle).toEqual({});
  });

  it('dispatches pie to buildPieOption', () => {
    const opt = buildOption(SAMPLE_ROWS, PIE_CONFIG) as Record<string, unknown>;
    const series = asSeries(opt);
    expect(series[0].type).toBe('pie');
  });

  it('dispatches scatter to buildScatterOption', () => {
    const opt = buildOption(SAMPLE_ROWS, SCATTER_CONFIG) as Record<string, unknown>;
    const series = asSeries(opt);
    expect(series[0].type).toBe('scatter');
  });

  it('dispatches histogram to buildHistogramOption', () => {
    const opt = buildOption(HISTOGRAM_ROWS, HISTOGRAM_CONFIG) as Record<string, unknown>;
    const series = asSeries(opt);
    expect(series[0].type).toBe('bar');
  });

  it('dispatches treemap to buildTreemapOption', () => {
    const opt = buildOption(SAMPLE_ROWS, TREEMAP_CONFIG) as Record<string, unknown>;
    const series = asSeries(opt);
    expect(series[0].type).toBe('treemap');
  });

  it('throws on unsupported chart type', () => {
    const config: ChartOptionConfig = { ...BAR_CONFIG, type: 'radar' };
    expect(() => buildOption(SAMPLE_ROWS, config)).toThrow('Unsupported chart type: radar');
  });
});
