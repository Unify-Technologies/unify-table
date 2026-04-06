// @unify/table-charts — ECharts rendering utilities for unify-table

export { EChartsWrapper } from "./EChartsWrapper.js";
export { Sparkline } from "./Sparkline.js";

// ECharts option builders (pure functions — no SQL, no React hooks)
export {
  buildOption,
  buildBarLineOption,
  buildPieOption,
  buildScatterOption,
  buildHistogramOption,
  buildHeatmapOption,
  buildTreemapOption,
  buildFunnelOption,
  resolveColors,
  DARK_CHART_THEME,
  LIGHT_CHART_THEME,
} from "./options.js";
export type { ChartOptionConfig, ChartTheme } from "./options.js";

// Types
export type { ChartConfig, ChartProps, ChartType, ValueField } from "./types.js";
export type { EChartsWrapperProps } from "./EChartsWrapper.js";
export type { SparklineProps } from "./Sparkline.js";
