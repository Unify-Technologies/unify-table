import { useRef, useEffect } from "react";
import * as echarts from "echarts";

export interface EChartsWrapperProps {
  option: echarts.EChartsCoreOption;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Thin React wrapper around an ECharts instance.
 * - Creates / disposes the instance on mount / unmount.
 * - Auto-resizes via ResizeObserver.
 * - Calls setOption when the option prop changes.
 */
export function EChartsWrapper({ option, className, style }: EChartsWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  // Initialise + dispose
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const instance = echarts.init(el);
    chartRef.current = instance;

    const ro = new ResizeObserver(() => {
      instance.resize();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      instance.dispose();
      chartRef.current = null;
    };
  }, []);

  // Update option
  useEffect(() => {
    if (chartRef.current && option) {
      chartRef.current.setOption(option, { notMerge: true });
    }
  }, [option]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", minHeight: 200, ...style }}
    />
  );
}
