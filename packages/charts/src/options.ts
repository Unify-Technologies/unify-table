/**
 * ECharts option builders — pure functions that turn query result rows into ECharts options.
 * These are the rendering-side counterpart to the SQL builders in @unify/table-core.
 */
import type { EChartsCoreOption } from 'echarts';

type Row = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Chart theme — passed through to control dark/light styling
// ---------------------------------------------------------------------------

export interface ChartTheme {
  /** Main text color */
  text: string;
  /** Secondary text (axis labels, legends) */
  textSecondary: string;
  /** Muted text (axis names, visual map labels) */
  textMuted: string;
  /** Tooltip background */
  tooltipBg: string;
  /** Tooltip border */
  tooltipBorder: string;
  /** Surface color (sequential ranges, etc.) */
  surface: string;
  /** Semi-transparent divider for pie slice / heatmap cell borders */
  divider: string;
}

export const DARK_CHART_THEME: ChartTheme = {
  text: '#e0e0e0',
  textSecondary: 'rgba(180,180,180,0.8)',
  textMuted: 'rgba(180,180,180,0.6)',
  tooltipBg: 'rgba(30,30,50,0.92)',
  tooltipBorder: 'rgba(255,255,255,0.08)',
  surface: '#1a1e2e',
  divider: 'rgba(0,0,0,0.4)',
};

export const LIGHT_CHART_THEME: ChartTheme = {
  text: '#073642',
  textSecondary: '#586e75',
  textMuted: '#93a1a1',
  tooltipBg: 'rgba(253,246,227,0.96)',
  tooltipBorder: 'rgba(0,0,0,0.08)',
  surface: '#fdf6e3',
  divider: 'rgba(253,246,227,0.7)',
};

// ---------------------------------------------------------------------------
// Chart config types (compatible with @unify/table-core ChartDisplayConfig)
// ---------------------------------------------------------------------------

export interface ValueField {
  field: string;
  agg: string;
  label?: string;
  format?: string;
  yAxis?: 'left' | 'right';
}

export interface ChartOptionConfig {
  type: string;
  x: string;
  y: ValueField | ValueField[];
  series?: string;
  size?: ValueField;
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
  theme?: ChartTheme;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_COLORS = [
  '#6b9bd2', '#7ec4a0', '#f0c05a', '#e07070', '#89c9e0',
  '#5da87e', '#f09060', '#a070c0', '#e090cc',
];

// ---------------------------------------------------------------------------
// Tufte-inspired base styling — maximise data-ink ratio
// ---------------------------------------------------------------------------

/** Shared formatting for tooltip values — no floating point noise */
function formatTooltipValue(val: unknown): string {
  const n = Number(val);
  if (isNaN(n)) return String(val);
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

const TUFTE_AXIS_LINE = { show: false };
const TUFTE_AXIS_TICK = { show: false };
const TUFTE_SPLIT_LINE = { show: true, lineStyle: { color: 'rgba(128,128,128,0.12)', type: 'solid' as const, width: 1 } };

function tufteAxisLabel(t: ChartTheme) {
  return { fontSize: 10, color: t.textSecondary };
}

function tufteTooltip(t: ChartTheme) {
  return {
    backgroundColor: t.tooltipBg,
    borderColor: t.tooltipBorder,
    borderWidth: 1,
    textStyle: { color: t.text, fontSize: 11 },
    padding: [6, 10] as number[],
    valueFormatter: formatTooltipValue,
    confine: true,
    appendToBody: true,
  };
}

const TUFTE_GRID = { left: 8, right: 8, top: 32, bottom: 8, containLabel: true };

function tufteLegend(t: ChartTheme) {
  return {
    textStyle: { color: t.textSecondary, fontSize: 10 },
    icon: 'circle',
    itemWidth: 8,
    itemHeight: 8,
    itemGap: 12,
  };
}

export function resolveColors(scheme?: string[] | 'default' | 'warm' | 'cool' | 'monochrome'): string[] {
  if (Array.isArray(scheme)) return scheme;
  switch (scheme) {
    case 'warm':
      return ['#ee6666', '#fac858', '#fc8452', '#ea7ccc', '#f5c842'];
    case 'cool':
      return ['#5470c6', '#73c0de', '#3ba272', '#91cc75', '#7bc8f6'];
    case 'monochrome':
      return ['#333', '#555', '#777', '#999', '#bbb', '#ddd'];
    default:
      return DEFAULT_COLORS;
  }
}

function normalizeY(y: ValueField | ValueField[]): ValueField[] {
  return Array.isArray(y) ? y : [y];
}

function aggAlias(vf: ValueField): string {
  return vf.label ?? `${vf.agg}_${vf.field}`;
}

// ---------------------------------------------------------------------------
// Bar / Line / Area
// ---------------------------------------------------------------------------

function buildAxis(
  categories: string[],
  series: Record<string, unknown>[],
  config: ChartOptionConfig,
): EChartsCoreOption {
  const t = config.theme ?? DARK_CHART_THEME;
  const horizontal = config.horizontal;
  const catAxis: Record<string, unknown> = {
    type: 'category',
    data: categories,
    name: config.xAxis?.label,
    nameTextStyle: { color: t.textMuted, fontSize: 10 },
    axisLine: TUFTE_AXIS_LINE,
    axisTick: TUFTE_AXIS_TICK,
    axisLabel: { ...tufteAxisLabel(t), ...(config.xAxis?.rotate ? { rotate: config.xAxis.rotate } : {}) },
    splitLine: { show: false },
  };
  const valAxis: Record<string, unknown> = {
    type: 'value',
    name: config.yAxis?.label,
    nameTextStyle: { color: t.textMuted, fontSize: 10 },
    min: config.yAxis?.min,
    max: config.yAxis?.max,
    axisLine: TUFTE_AXIS_LINE,
    axisTick: TUFTE_AXIS_TICK,
    axisLabel: tufteAxisLabel(t),
    splitLine: TUFTE_SPLIT_LINE,
  };

  const hasRight = normalizeY(config.y).some((vf) => vf.yAxis === 'right');
  const rightAxis = { type: 'value', name: config.yAxisRight?.label, axisLine: TUFTE_AXIS_LINE, axisTick: TUFTE_AXIS_TICK, axisLabel: tufteAxisLabel(t), splitLine: { show: false } };

  const option: Record<string, unknown> = {
    color: resolveColors(config.colorScheme),
    backgroundColor: 'transparent',
    tooltip: { ...tufteTooltip(t), trigger: 'axis' },
    grid: TUFTE_GRID,
    xAxis: horizontal ? (hasRight ? [valAxis, rightAxis] : valAxis) : catAxis,
    yAxis: horizontal ? catAxis : (hasRight ? [valAxis, rightAxis] : valAxis),
    series,
  };

  if (config.title) {
    option.title = { text: config.title, subtext: config.subtitle, textStyle: { color: t.text, fontSize: 13, fontWeight: 500 } };
  }
  // Only show legend when there are multiple series
  if (config.legend !== false && (Array.isArray(series) && series.length > 1)) {
    const pos = typeof config.legend === 'string' ? config.legend : 'top';
    option.legend = { ...tufteLegend(t), show: true, [pos === 'left' || pos === 'right' ? pos : (pos === 'bottom' ? 'bottom' : 'top')]: 0 };
  }
  if (config.zoom) {
    option.dataZoom = [
      { type: 'inside' },
      { type: 'slider', height: 16, borderColor: 'transparent', backgroundColor: 'rgba(128,128,128,0.08)', fillerColor: 'rgba(100,140,200,0.15)', handleStyle: { color: '#6b9bd2' }, textStyle: { color: t.textMuted, fontSize: 9 } },
    ];
  }

  return option;
}

export function buildBarLineOption(rows: Row[], config: ChartOptionConfig): EChartsCoreOption {
  const yFields = normalizeY(config.y);
  const xKey = config.x;
  const isArea = config.type === 'area';
  const chartType = config.type === 'area' ? 'line' : config.type === 'funnel' ? 'bar' : config.type;

  if (config.series) {
    const seriesKey = config.series;
    const seriesValues = [...new Set(rows.map((r) => String(r[seriesKey])))];
    const categories = [...new Set(rows.map((r) => String(r[xKey])))];
    const yf = yFields[0];
    const valKey = aggAlias(yf);

    const lookup = new Map<string, Map<string, number>>();
    for (const r of rows) {
      const cat = String(r[xKey]);
      const sv = String(r[seriesKey]);
      if (!lookup.has(sv)) lookup.set(sv, new Map());
      lookup.get(sv)!.set(cat, Number(r[valKey]) || 0);
    }

    const seriesArr = seriesValues.map((sv) => ({
      name: sv,
      type: chartType,
      stack: config.stacked ? 'total' : undefined,
      areaStyle: isArea ? {} : undefined,
      data: categories.map((c) => lookup.get(sv)?.get(c) ?? 0),
      label: config.showValues ? { show: true } : undefined,
    }));

    return buildAxis(categories, seriesArr, config);
  }

  const categories = rows.map((r) => String(r[xKey]));
  const seriesArr = yFields.map((vf) => {
    const key = aggAlias(vf);
    return {
      name: vf.label ?? key,
      type: chartType,
      stack: config.stacked ? 'total' : undefined,
      areaStyle: isArea ? {} : undefined,
      data: rows.map((r) => Number(r[key]) || 0),
      yAxisIndex: vf.yAxis === 'right' ? 1 : 0,
      label: config.showValues ? { show: true } : undefined,
    };
  });

  return buildAxis(categories, seriesArr, config);
}

// ---------------------------------------------------------------------------
// Pie / Donut
// ---------------------------------------------------------------------------

export function buildPieOption(rows: Row[], config: ChartOptionConfig): EChartsCoreOption {
  const t = config.theme ?? DARK_CHART_THEME;
  const yFields = normalizeY(config.y);
  const vf = yFields[0];
  const labelKey = config.x;
  const valKey = aggAlias(vf);
  const isDonut = config.type === 'donut';
  const colors = resolveColors(config.colorScheme);

  // When series is set, build nested rings:
  // Inner = X categories (regions), outer = series (tickers) grouped under their parent category
  if (config.series) {
    const seriesKey = config.series;

    // Group rows by category, preserving order
    const catMap = new Map<string, { total: number; children: { name: string; value: number }[] }>();
    for (const r of rows) {
      const cat = String(r[labelKey]);
      const sv = String(r[seriesKey]);
      const val = Math.abs(Number(r[valKey]) || 0);
      if (!catMap.has(cat)) catMap.set(cat, { total: 0, children: [] });
      const entry = catMap.get(cat)!;
      entry.total += val;
      entry.children.push({ name: sv, value: val });
    }

    const categories = [...catMap.keys()];

    // Inner ring: one slice per category
    const innerData = categories.map((cat) => ({
      name: cat,
      value: catMap.get(cat)!.total,
    }));

    // Color map: each category gets a base color
    const catColorMap = new Map<string, string>();
    categories.forEach((cat, i) => {
      catColorMap.set(cat, colors[i % colors.length]);
    });

    // Outer ring: children sorted under their parent category so arcs align
    // Vary lightness per child within a category for distinction
    const outerData: { name: string; value: number; itemStyle: Record<string, unknown> }[] = [];
    for (const cat of categories) {
      const { children } = catMap.get(cat)!;
      const baseColor = catColorMap.get(cat)!;
      for (const child of children) {
        outerData.push({
          name: `${cat} / ${child.name}`,
          value: child.value,
          itemStyle: { color: baseColor },
        });
      }
    }

    const option: Record<string, unknown> = {
      color: colors,
      backgroundColor: 'transparent',
      tooltip: { ...tufteTooltip(t), trigger: 'item' },
      series: [
        {
          type: 'pie',
          name: labelKey,
          radius: isDonut ? ['25%', '48%'] : [0, '48%'],
          data: innerData,
          label: { show: false },
          itemStyle: { borderColor: t.divider, borderWidth: 2 },
        },
        {
          type: 'pie',
          name: seriesKey,
          radius: ['54%', '72%'],
          data: outerData,
          label: { show: false },
          emphasis: {
            label: { show: true, color: t.text, fontSize: 10, formatter: (p: { name: string }) => p.name.split(' / ')[1] ?? p.name },
          },
          itemStyle: { borderColor: t.divider, borderWidth: 1 },
        },
      ],
    };

    if (config.title) option.title = { text: config.title, subtext: config.subtitle, textStyle: { color: t.text, fontSize: 13 } };
    // Only show categories in legend
    if (config.legend !== false) option.legend = { ...tufteLegend(t), show: true, data: categories };
    return option;
  }

  // Simple pie/donut — no series
  const data = rows.map((r) => ({
    name: String(r[labelKey]),
    value: Number(r[valKey]) || 0,
  }));

  const option: Record<string, unknown> = {
    color: colors,
    backgroundColor: 'transparent',
    tooltip: { ...tufteTooltip(t), trigger: 'item' },
    series: [{
      type: 'pie',
      radius: isDonut ? ['40%', '70%'] : '70%',
      data,
      label: { show: true, color: t.textSecondary, fontSize: 10, formatter: config.showValues ? '{b}: {c} ({d}%)' : '{b}' },
      itemStyle: { borderColor: 'transparent', borderWidth: 1 },
    }],
  };

  if (config.title) option.title = { text: config.title, subtext: config.subtitle, textStyle: { color: t.text, fontSize: 13 } };
  if (config.legend !== false) option.legend = { ...tufteLegend(t), show: true };
  return option;
}

// ---------------------------------------------------------------------------
// Scatter
// ---------------------------------------------------------------------------

export function buildScatterOption(rows: Row[], config: ChartOptionConfig): EChartsCoreOption {
  const t = config.theme ?? DARK_CHART_THEME;
  const xKey = config.x;
  const yFields = normalizeY(config.y);
  const yKey = yFields[0].field;
  const sizeField = config.size;

  if (config.series) {
    const seriesKey = config.series;
    const groups = new Map<string, number[][]>();
    for (const r of rows) {
      const sv = String(r[seriesKey]);
      if (!groups.has(sv)) groups.set(sv, []);
      const point: number[] = [Number(r[xKey]) || 0, Number(r[yKey]) || 0];
      if (sizeField) point.push(Number(r[sizeField.field]) || 0);
      groups.get(sv)!.push(point);
    }

    const series = [...groups.entries()].map(([name, data]) => ({
      name,
      type: 'scatter' as const,
      data,
      symbolSize: sizeField ? (val: number[]) => Math.sqrt(val[2]) * 2 : undefined,
    }));

    return {
      color: resolveColors(config.colorScheme),
      backgroundColor: 'transparent',
      tooltip: { ...tufteTooltip(t), trigger: 'item' },
      grid: TUFTE_GRID,
      xAxis: { type: 'value', name: config.xAxis?.label, axisLine: TUFTE_AXIS_LINE, axisTick: TUFTE_AXIS_TICK, axisLabel: tufteAxisLabel(t), splitLine: TUFTE_SPLIT_LINE },
      yAxis: { type: 'value', name: config.yAxis?.label, axisLine: TUFTE_AXIS_LINE, axisTick: TUFTE_AXIS_TICK, axisLabel: tufteAxisLabel(t), splitLine: TUFTE_SPLIT_LINE },
      series,
      title: config.title ? { text: config.title, subtext: config.subtitle, textStyle: { color: t.text, fontSize: 13 } } : undefined,
      legend: config.legend !== false ? { ...tufteLegend(t), show: true } : undefined,
    };
  }

  const data = rows.map((r) => {
    const point: number[] = [Number(r[xKey]) || 0, Number(r[yKey]) || 0];
    if (sizeField) point.push(Number(r[sizeField.field]) || 0);
    return point;
  });

  return {
    color: resolveColors(config.colorScheme),
    backgroundColor: 'transparent',
    tooltip: { ...tufteTooltip(t), trigger: 'item' },
    grid: TUFTE_GRID,
    xAxis: { type: 'value', name: config.xAxis?.label, axisLine: TUFTE_AXIS_LINE, axisTick: TUFTE_AXIS_TICK, axisLabel: tufteAxisLabel(t), splitLine: TUFTE_SPLIT_LINE },
    yAxis: { type: 'value', name: config.yAxis?.label, axisLine: TUFTE_AXIS_LINE, axisTick: TUFTE_AXIS_TICK, axisLabel: tufteAxisLabel(t), splitLine: TUFTE_SPLIT_LINE },
    series: [{
      type: 'scatter',
      data,
      symbolSize: sizeField ? (val: number[]) => Math.sqrt(val[2]) * 2 : undefined,
    }],
    title: config.title ? { text: config.title, subtext: config.subtitle, textStyle: { color: t.text, fontSize: 13 } } : undefined,
  };
}

// ---------------------------------------------------------------------------
// Histogram
// ---------------------------------------------------------------------------

export function buildHistogramOption(rows: Row[], config: ChartOptionConfig): EChartsCoreOption {
  const t = config.theme ?? DARK_CHART_THEME;
  const categories = rows.map((r) => {
    const start = Number(r.bin_start);
    const end = Number(r.bin_end);
    return `${start.toPrecision(3)}–${end.toPrecision(3)}`;
  });
  const values = rows.map((r) => Number(r.count) || 0);

  return {
    color: resolveColors(config.colorScheme),
    backgroundColor: 'transparent',
    tooltip: { ...tufteTooltip(t), trigger: 'axis' },
    grid: TUFTE_GRID,
    xAxis: { type: 'category', data: categories, name: config.xAxis?.label, axisLine: TUFTE_AXIS_LINE, axisTick: TUFTE_AXIS_TICK, axisLabel: { ...tufteAxisLabel(t), rotate: 30 }, splitLine: { show: false } },
    yAxis: { type: 'value', name: config.yAxis?.label ?? 'Count', axisLine: TUFTE_AXIS_LINE, axisTick: TUFTE_AXIS_TICK, axisLabel: tufteAxisLabel(t), splitLine: TUFTE_SPLIT_LINE },
    series: [{ type: 'bar', data: values, barWidth: '95%' }],
    title: config.title ? { text: config.title, subtext: config.subtitle, textStyle: { color: t.text, fontSize: 13 } } : undefined,
  };
}

// ---------------------------------------------------------------------------
// Heatmap
// ---------------------------------------------------------------------------

export function buildHeatmapOption(rows: Row[], config: ChartOptionConfig): EChartsCoreOption {
  const t = config.theme ?? DARK_CHART_THEME;
  const yFields = normalizeY(config.y);
  const vf = yFields[0];
  const xKey = config.x;
  const valKey = aggAlias(vf);

  const xCats = [...new Set(rows.map((r) => String(r[xKey])))];
  const cols = Object.keys(rows[0] ?? {});
  const yCol = cols[1] ?? vf.field;
  const yCats = [...new Set(rows.map((r) => String(r[yCol])))];

  const data = rows.map((r) => [
    xCats.indexOf(String(r[xKey])),
    yCats.indexOf(String(r[yCol])),
    Number(r[valKey]) || 0,
  ]);

  const values = data.map((d) => d[2] as number);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  return {
    backgroundColor: 'transparent',
    tooltip: { ...tufteTooltip(t), position: 'top' },
    grid: { ...TUFTE_GRID, bottom: 48 },
    xAxis: { type: 'category', data: xCats, name: config.xAxis?.label, axisLine: TUFTE_AXIS_LINE, axisTick: TUFTE_AXIS_TICK, axisLabel: tufteAxisLabel(t), splitLine: { show: false } },
    yAxis: { type: 'category', data: yCats, name: config.yAxis?.label, axisLine: TUFTE_AXIS_LINE, axisTick: TUFTE_AXIS_TICK, axisLabel: tufteAxisLabel(t), splitLine: { show: false } },
    visualMap: { min: minVal, max: maxVal, calculable: true, orient: 'horizontal', left: 'center', bottom: 0, textStyle: { color: t.textMuted, fontSize: 9 } },
    series: [{ type: 'heatmap', data, label: config.showValues ? { show: true, color: t.text, fontSize: 9 } : undefined }],
    title: config.title ? { text: config.title, subtext: config.subtitle, textStyle: { color: t.text, fontSize: 13 } } : undefined,
  };
}

// ---------------------------------------------------------------------------
// Treemap
// ---------------------------------------------------------------------------

export function buildTreemapOption(rows: Row[], config: ChartOptionConfig): EChartsCoreOption {
  const t = config.theme ?? DARK_CHART_THEME;
  const yFields = normalizeY(config.y);
  const vf = yFields[0];
  const labelKey = config.x;
  const valKey = aggAlias(vf);

  const data = rows.map((r) => ({
    name: String(r[labelKey]),
    value: Number(r[valKey]) || 0,
  }));

  return {
    color: resolveColors(config.colorScheme),
    backgroundColor: 'transparent',
    tooltip: { ...tufteTooltip(t), trigger: 'item' },
    series: [{ type: 'treemap', data, label: { color: t.text, fontSize: 10 }, breadcrumb: { show: false } }],
    title: config.title ? { text: config.title, subtext: config.subtitle, textStyle: { color: t.text, fontSize: 13 } } : undefined,
  };
}

// ---------------------------------------------------------------------------
// Funnel
// ---------------------------------------------------------------------------

export function buildFunnelOption(rows: Row[], config: ChartOptionConfig): EChartsCoreOption {
  const t = config.theme ?? DARK_CHART_THEME;
  const yFields = normalizeY(config.y);
  const vf = yFields[0];
  const labelKey = config.x;
  const valKey = aggAlias(vf);

  const data = rows.map((r) => ({
    name: String(r[labelKey]),
    value: Number(r[valKey]) || 0,
  }));

  return {
    color: resolveColors(config.colorScheme),
    backgroundColor: 'transparent',
    tooltip: { ...tufteTooltip(t), trigger: 'item' },
    series: [{ type: 'funnel', data, sort: 'descending', label: { color: t.text, fontSize: 10 } }],
    title: config.title ? { text: config.title, subtext: config.subtitle, textStyle: { color: t.text, fontSize: 13 } } : undefined,
    legend: config.legend !== false ? { ...tufteLegend(t), show: true } : undefined,
  };
}

// ---------------------------------------------------------------------------
// Unified option builder (dispatches by chart type)
// ---------------------------------------------------------------------------

export function buildOption(rows: Row[], config: ChartOptionConfig): EChartsCoreOption {
  switch (config.type) {
    case 'bar':
    case 'line':
    case 'area':
      return buildBarLineOption(rows, config);
    case 'pie':
    case 'donut':
      return buildPieOption(rows, config);
    case 'scatter':
      return buildScatterOption(rows, config);
    case 'histogram':
      return buildHistogramOption(rows, config);
    case 'heatmap':
      return buildHeatmapOption(rows, config);
    case 'treemap':
      return buildTreemapOption(rows, config);
    case 'funnel':
      return buildFunnelOption(rows, config);
    default:
      throw new Error(`Unsupported chart type: ${config.type}`);
  }
}
