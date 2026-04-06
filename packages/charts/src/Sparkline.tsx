import { EChartsWrapper } from "./EChartsWrapper.js";
import type { EChartsCoreOption } from "echarts";

export interface SparklineProps {
  data: number[];
  type?: "line" | "bar";
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

/**
 * Tiny inline chart for table cells.
 * Renders a minimal ECharts instance with no axes, no labels, no tooltip chrome.
 */
export function Sparkline({
  data,
  type = "line",
  width = 80,
  height = 24,
  color = "#5470c6",
  className,
}: SparklineProps) {
  const option: EChartsCoreOption = {
    grid: { top: 0, right: 0, bottom: 0, left: 0 },
    xAxis: { type: "category", show: false, data: data.map((_, i) => i) },
    yAxis: { type: "value", show: false },
    tooltip: { show: false },
    series: [
      {
        type: type === "bar" ? "bar" : "line",
        data,
        showSymbol: false,
        lineStyle: type === "line" ? { width: 1.5, color } : undefined,
        areaStyle: type === "line" ? { color, opacity: 0.15 } : undefined,
        itemStyle: { color },
        barWidth: "60%",
        animation: false,
      },
    ],
    animation: false,
  };

  return (
    <EChartsWrapper
      option={option}
      className={className}
      style={{ width, height, minHeight: height }}
    />
  );
}
