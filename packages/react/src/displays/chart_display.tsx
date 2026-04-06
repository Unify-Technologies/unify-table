import { useMemo } from "react";
import { chartDisplayType, isIdentityColumn, isNumericType } from "@unify/table-core";
import type { ChartDisplayConfig, ChartType, ValueField } from "@unify/table-core";
import { buildOption, EChartsWrapper, type ChartOptionConfig } from "@unify/table-charts";
import type { DisplayDescriptor, DisplayRenderProps, DisplayConfigProps } from "./types.js";
import { useDisplayData } from "./useDisplayData.js";
import { useChartTheme } from "./useChartTheme.js";
import {
  PieChart,
  BarChart3,
  LineChart,
  AreaChart,
  CircleDot,
  ChartScatter,
  Grid3x3,
  LayoutGrid,
  Filter,
  Layers,
  Columns2,
  ZoomIn,
} from "lucide-react";
import { selectStyle } from "./shared.js";

// ---------------------------------------------------------------------------
// Chart types grid
// ---------------------------------------------------------------------------

const iconProps = { size: 14, strokeWidth: 2 } as const;

const CHART_TYPES: { type: ChartType; label: string; icon: React.ReactNode }[] = [
  { type: "bar", label: "Bar", icon: <BarChart3 {...iconProps} /> },
  { type: "line", label: "Line", icon: <LineChart {...iconProps} /> },
  { type: "area", label: "Area", icon: <AreaChart {...iconProps} /> },
  { type: "pie", label: "Pie", icon: <PieChart {...iconProps} /> },
  { type: "donut", label: "Donut", icon: <CircleDot {...iconProps} /> },
  { type: "scatter", label: "Scatter", icon: <ChartScatter {...iconProps} /> },
  { type: "histogram", label: "Histogram", icon: <BarChart3 {...iconProps} /> },
  { type: "heatmap", label: "Heatmap", icon: <Grid3x3 {...iconProps} /> },
  { type: "treemap", label: "Treemap", icon: <LayoutGrid {...iconProps} /> },
  { type: "funnel", label: "Funnel", icon: <Filter {...iconProps} /> },
];

const AGG_OPTIONS = ["sum", "avg", "count", "min", "max", "median", "count_distinct"] as const;

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function ChartRender({ config, sql, engine }: DisplayRenderProps<ChartDisplayConfig>) {
  const { rows, isLoading, error } = useDisplayData(sql, engine);
  const { ref, theme } = useChartTheme();

  const option = useMemo(() => {
    if (rows.length === 0) return null;
    return buildOption(rows, { ...(config as unknown as ChartOptionConfig), theme });
  }, [rows, config, theme]);

  if (error) {
    return (
      <div ref={ref} className="utbl-display-error">
        {error.message}
      </div>
    );
  }

  if (isLoading && rows.length === 0) {
    return (
      <div ref={ref} className="utbl-display-loading">
        Loading chart data...
      </div>
    );
  }

  if (!option) {
    return (
      <div ref={ref} className="utbl-display-loading">
        No data
      </div>
    );
  }

  return (
    <div ref={ref} style={{ display: "flex", flex: 1, minHeight: 300 }}>
      <EChartsWrapper option={option} style={{ flex: 1, minHeight: 300 }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Config panel
// ---------------------------------------------------------------------------

function ChartConfig({ config, onChange, columns }: DisplayConfigProps<ChartDisplayConfig>) {
  const cols = columns.filter((c) => !isIdentityColumn(c.name));
  const numericCols = cols.filter((c) => isNumericType(c.mappedType));
  const allCols = cols;
  const yArr = Array.isArray(config.y) ? config.y : [config.y];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "0.625rem" }}>
      {/* Chart type — icon grid */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {CHART_TYPES.map((ct) => (
          <button
            key={ct.type}
            className="utbl-tooltip"
            data-tooltip={ct.label}
            onClick={() => onChange({ ...config, type: ct.type })}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              padding: 0,
              border: "1px solid var(--utbl-border)",
              borderRadius: 3,
              background: config.type === ct.type ? "var(--utbl-accent)" : "transparent",
              color: config.type === ct.type ? "#fff" : "var(--utbl-text-muted)",
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {ct.icon}
          </button>
        ))}
      </div>

      {/* X axis */}
      <div>
        <span className="utbl-field-label">X Axis</span>
        <select
          value={config.x}
          onChange={(e) => onChange({ ...config, x: e.target.value })}
          style={selectStyle}
        >
          <option value="">Select column...</option>
          {allCols.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Y axis */}
      <div>
        <span className="utbl-field-label">Y Axis</span>
        <div style={{ display: "flex", gap: 3 }}>
          <select
            value={yArr[0]?.field ?? ""}
            onChange={(e) => onChange({ ...config, y: { ...yArr[0], field: e.target.value } })}
            style={{ ...selectStyle, flex: 1, width: "auto", minWidth: 0 }}
          >
            <option value="">Column...</option>
            {numericCols.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={yArr[0]?.agg ?? "sum"}
            onChange={(e) =>
              onChange({ ...config, y: { ...yArr[0], agg: e.target.value as ValueField["agg"] } })
            }
            style={{ ...selectStyle, width: "auto", flex: "0 0 auto" }}
          >
            {AGG_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Series */}
      <div>
        <span className="utbl-field-label">Series</span>
        <select
          value={config.series ?? ""}
          onChange={(e) => onChange({ ...config, series: e.target.value || undefined })}
          style={selectStyle}
        >
          <option value="">None</option>
          {allCols.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Options row */}
      <div style={{ display: "flex", gap: 3 }}>
        {(
          [
            {
              key: "stacked" as const,
              label: "Stacked",
              icon: <Layers size={14} strokeWidth={2} />,
            },
            {
              key: "horizontal" as const,
              label: "Horizontal",
              icon: <Columns2 size={14} strokeWidth={2} />,
            },
            { key: "zoom" as const, label: "Zoom", icon: <ZoomIn size={14} strokeWidth={2} /> },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            className="utbl-tooltip"
            data-tooltip={opt.label}
            onClick={() => onChange({ ...config, [opt.key]: !config[opt.key] })}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              padding: 0,
              border: "1px solid var(--utbl-border)",
              borderRadius: 3,
              background: config[opt.key] ? "var(--utbl-accent)" : "transparent",
              color: config[opt.key] ? "#fff" : "var(--utbl-text-muted)",
              cursor: "pointer",
            }}
          >
            {opt.icon}
          </button>
        ))}
      </div>

      {/* Limit */}
      <div>
        <span className="utbl-field-label">Limit</span>
        <input
          className="utbl-input"
          type="number"
          value={config.limit ?? ""}
          onChange={(e) =>
            onChange({ ...config, limit: e.target.value ? Number(e.target.value) : undefined })
          }
          placeholder="No limit"
          style={{ width: 70 }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Descriptor
// ---------------------------------------------------------------------------

export const chartDisplay: DisplayDescriptor<ChartDisplayConfig> = {
  type: chartDisplayType,
  icon: PieChart,
  render: (props) => <ChartRender {...props} />,
  renderConfig: (props) => <ChartConfig {...props} />,
};
