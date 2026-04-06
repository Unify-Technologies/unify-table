import { useMemo } from "react";
import { outliersDisplayType, isIdentityColumn, isNumericType } from "@unify/table-core";
import type { OutliersDisplayConfig, OutlierMethod } from "@unify/table-core";
import type { DisplayDescriptor, DisplayRenderProps, DisplayConfigProps } from "./types.js";
import { useDisplayData } from "./useDisplayData.js";
import { SearchX } from "lucide-react";
import { selectStyle } from "./shared.js";

// ---------------------------------------------------------------------------
// Box plot SVG
// ---------------------------------------------------------------------------

interface BoxStats {
  mu: number;
  sigma: number;
  min: number;
  max: number;
  q1: number;
  median: number;
  q3: number;
  lower: number;
  upper: number;
}

function BoxPlot({ stats, outlierValues }: { stats: BoxStats; outlierValues: number[] }) {
  const width = 600;
  const height = 80;
  const pad = 40;
  const plotW = width - pad * 2;
  const boxY = 20;
  const boxH = 30;

  const lo = Math.min(stats.min, ...outlierValues);
  const hi = Math.max(stats.max, ...outlierValues);
  const range = hi - lo || 1;
  const x = (v: number) => pad + ((v - lo) / range) * plotW;

  const whiskerLo = Math.max(stats.lower, stats.min);
  const whiskerHi = Math.min(stats.upper, stats.max);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: "100%", maxHeight: 100, overflow: "visible" }}
    >
      {/* Whisker line */}
      <line
        x1={x(whiskerLo)}
        x2={x(whiskerHi)}
        y1={boxY + boxH / 2}
        y2={boxY + boxH / 2}
        stroke="var(--utbl-text-muted)"
        strokeWidth={1}
      />
      {/* Whisker caps */}
      <line
        x1={x(whiskerLo)}
        x2={x(whiskerLo)}
        y1={boxY + 5}
        y2={boxY + boxH - 5}
        stroke="var(--utbl-text-muted)"
        strokeWidth={1}
      />
      <line
        x1={x(whiskerHi)}
        x2={x(whiskerHi)}
        y1={boxY + 5}
        y2={boxY + boxH - 5}
        stroke="var(--utbl-text-muted)"
        strokeWidth={1}
      />

      {/* IQR box */}
      <rect
        x={x(stats.q1)}
        y={boxY}
        width={x(stats.q3) - x(stats.q1)}
        height={boxH}
        fill="var(--utbl-accent)"
        fillOpacity={0.25}
        stroke="var(--utbl-accent)"
        strokeWidth={1.5}
        rx={3}
      />

      {/* Median line */}
      <line
        x1={x(stats.median)}
        x2={x(stats.median)}
        y1={boxY}
        y2={boxY + boxH}
        stroke="var(--utbl-accent)"
        strokeWidth={2}
      />

      {/* Mean marker */}
      <circle
        cx={x(stats.mu)}
        cy={boxY + boxH / 2}
        r={3}
        fill="var(--utbl-text)"
        stroke="var(--utbl-surface)"
        strokeWidth={1}
      />

      {/* Outlier dots */}
      {outlierValues.map((v, i) => (
        <circle
          key={i}
          cx={x(v)}
          cy={boxY + boxH / 2}
          r={4}
          fill="#ef4444"
          fillOpacity={0.8}
          stroke="#ef4444"
          strokeWidth={0.5}
        />
      ))}

      {/* Labels */}
      <text
        x={x(stats.q1)}
        y={boxY + boxH + 14}
        textAnchor="middle"
        fill="var(--utbl-text-muted)"
        fontSize={9}
      >
        Q1: {stats.q1.toFixed(1)}
      </text>
      <text
        x={x(stats.median)}
        y={boxY - 6}
        textAnchor="middle"
        fill="var(--utbl-accent)"
        fontSize={9}
      >
        Med: {stats.median.toFixed(1)}
      </text>
      <text
        x={x(stats.q3)}
        y={boxY + boxH + 14}
        textAnchor="middle"
        fill="var(--utbl-text-muted)"
        fontSize={9}
      >
        Q3: {stats.q3.toFixed(1)}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function OutliersRender({ config, sql, engine }: DisplayRenderProps<OutliersDisplayConfig>) {
  const { rows, isLoading, error } = useDisplayData(sql, engine);

  const { stats, outlierRows } = useMemo(() => {
    if (rows.length === 0) return { stats: null, outlierRows: [] };

    // Find stats from sentinel row (value IS NULL) or first row
    const sentinel = rows.find((r) => r.value === null || r.value === undefined);
    const statsRow = sentinel ?? rows[0];

    const s: BoxStats = {
      mu: Number(statsRow.mu ?? 0),
      sigma: Number(statsRow.sigma ?? 0),
      min: Number(statsRow.val_min ?? 0),
      max: Number(statsRow.val_max ?? 0),
      q1: Number(statsRow.q1 ?? 0),
      median: Number(statsRow.median ?? 0),
      q3: Number(statsRow.q3 ?? 0),
      lower: Number(statsRow.lower_bound ?? 0),
      upper: Number(statsRow.upper_bound ?? 0),
    };

    const outliers = rows.filter((r) => r.value != null);
    return { stats: s, outlierRows: outliers };
  }, [rows]);

  if (error) return <div className="utbl-display-error">{error.message}</div>;
  if (isLoading && rows.length === 0)
    return <div className="utbl-display-loading">Loading outlier analysis...</div>;
  if (!stats) return <div className="utbl-display-loading">No data</div>;

  const outlierValues = outlierRows.map((r) => Number(r.value));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        flex: 1,
        padding: 12,
        overflow: "auto",
      }}
    >
      {/* Summary */}
      <div
        style={{
          display: "flex",
          gap: 16,
          fontSize: "0.7rem",
          color: "var(--utbl-text-secondary)",
          flexWrap: "wrap",
        }}
      >
        <span>
          Mean: <strong style={{ color: "var(--utbl-text)" }}>{stats.mu.toFixed(2)}</strong>
        </span>
        <span>
          Std Dev: <strong style={{ color: "var(--utbl-text)" }}>{stats.sigma.toFixed(2)}</strong>
        </span>
        <span>
          IQR:{" "}
          <strong style={{ color: "var(--utbl-text)" }}>{(stats.q3 - stats.q1).toFixed(2)}</strong>
        </span>
        <span>
          Bounds:{" "}
          <strong style={{ color: "var(--utbl-text)" }}>
            [{stats.lower.toFixed(2)}, {stats.upper.toFixed(2)}]
          </strong>
        </span>
        <span>
          Outliers:{" "}
          <strong style={{ color: outlierRows.length > 0 ? "#ef4444" : "#22c55e" }}>
            {outlierRows.length}
          </strong>
        </span>
      </div>

      {/* Box plot */}
      <BoxPlot stats={stats} outlierValues={outlierValues} />

      {/* Outlier table */}
      {outlierRows.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: "1rem", fontWeight: 600, color: "#22c55e", marginBottom: 8 }}>
            No outliers detected
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--utbl-text-muted)", lineHeight: 1.5 }}>
            All values for &quot;{config.field}&quot; fall within{" "}
            {config.method === "iqr"
              ? `IQR \u00d7 ${config.threshold}`
              : `z-score ${config.threshold}`}{" "}
            bounds [{stats.lower.toFixed(2)}, {stats.upper.toFixed(2)}].
            <br />
            Try lowering the threshold to detect more extreme values.
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.65rem" }}>
            <thead>
              <tr>
                {config.labelField && (
                  <th
                    style={{
                      textAlign: "left",
                      padding: "6px 8px",
                      fontWeight: 600,
                      color: "var(--utbl-text-secondary)",
                      borderBottom: "1px solid var(--utbl-border)",
                      background: "var(--utbl-surface-alt)",
                      position: "sticky",
                      top: 0,
                    }}
                  >
                    Label
                  </th>
                )}
                <th
                  style={{
                    textAlign: "right",
                    padding: "6px 8px",
                    fontWeight: 600,
                    color: "var(--utbl-text-secondary)",
                    borderBottom: "1px solid var(--utbl-border)",
                    background: "var(--utbl-surface-alt)",
                    position: "sticky",
                    top: 0,
                  }}
                >
                  Value
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "6px 8px",
                    fontWeight: 600,
                    color: "var(--utbl-text-secondary)",
                    borderBottom: "1px solid var(--utbl-border)",
                    background: "var(--utbl-surface-alt)",
                    position: "sticky",
                    top: 0,
                  }}
                >
                  Z-Score
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "6px 8px",
                    fontWeight: 600,
                    color: "var(--utbl-text-secondary)",
                    borderBottom: "1px solid var(--utbl-border)",
                    background: "var(--utbl-surface-alt)",
                    position: "sticky",
                    top: 0,
                  }}
                >
                  Direction
                </th>
              </tr>
            </thead>
            <tbody>
              {outlierRows.map((r, i) => {
                const val = Number(r.value);
                const z = Number(r.zscore ?? 0);
                const above = val > stats.upper;
                return (
                  <tr key={i}>
                    {config.labelField && (
                      <td
                        style={{
                          padding: "4px 8px",
                          borderBottom: "1px solid var(--utbl-border)",
                          color: "var(--utbl-text)",
                        }}
                      >
                        {String(r.label ?? "")}
                      </td>
                    )}
                    <td
                      style={{
                        padding: "4px 8px",
                        textAlign: "right",
                        borderBottom: "1px solid var(--utbl-border)",
                        color: "#ef4444",
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {val.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td
                      style={{
                        padding: "4px 8px",
                        textAlign: "right",
                        borderBottom: "1px solid var(--utbl-border)",
                        color: "var(--utbl-text)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {z.toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: "4px 8px",
                        textAlign: "center",
                        borderBottom: "1px solid var(--utbl-border)",
                        color: above ? "#f97316" : "#3b82f6",
                        fontWeight: 600,
                      }}
                    >
                      {above ? "↑ High" : "↓ Low"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Config panel
// ---------------------------------------------------------------------------

function OutliersConfig({ config, onChange, columns }: DisplayConfigProps<OutliersDisplayConfig>) {
  const cols = columns.filter((c) => !isIdentityColumn(c.name));
  const numericCols = cols.filter((c) => isNumericType(c.mappedType));

  function switchMethod(method: OutlierMethod) {
    const defaultThresholds: Record<OutlierMethod, number> = { iqr: 1.5, zscore: 3.0 };
    const otherDefault = defaultThresholds[config.method];
    const newThreshold =
      config.threshold === otherDefault ? defaultThresholds[method] : config.threshold;
    onChange({ ...config, method, threshold: newThreshold });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "0.625rem" }}>
      <div>
        <span className="utbl-field-label">Field</span>
        <select
          value={config.field}
          onChange={(e) => onChange({ ...config, field: e.target.value })}
          style={selectStyle}
        >
          <option value="">Select column...</option>
          {numericCols.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="utbl-field-label">Label Field</span>
        <select
          value={config.labelField ?? ""}
          onChange={(e) => onChange({ ...config, labelField: e.target.value || undefined })}
          style={selectStyle}
        >
          <option value="">None</option>
          {cols.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="utbl-field-label">Method</span>
        <div className="utbl-segmented">
          <button
            className="utbl-segmented-btn"
            data-active={config.method === "iqr"}
            onClick={() => switchMethod("iqr")}
          >
            IQR
          </button>
          <button
            className="utbl-segmented-btn"
            data-active={config.method === "zscore"}
            onClick={() => switchMethod("zscore")}
          >
            Z-Score
          </button>
        </div>
      </div>

      <div>
        <span className="utbl-field-label">
          {config.method === "iqr" ? "IQR Multiplier" : "Z-Score Threshold"}
        </span>
        <input
          className="utbl-input"
          type="number"
          step={config.method === "iqr" ? 0.25 : 0.5}
          min={0.1}
          value={config.threshold}
          onChange={(e) => onChange({ ...config, threshold: Number(e.target.value) || 1.5 })}
          style={{ width: 70 }}
        />
      </div>

      <div>
        <span className="utbl-field-label">Max Outliers</span>
        <input
          className="utbl-input"
          type="number"
          value={config.limit ?? 100}
          onChange={(e) => onChange({ ...config, limit: Number(e.target.value) || 100 })}
          style={{ width: 70 }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Descriptor
// ---------------------------------------------------------------------------

export const outliersDisplay: DisplayDescriptor<OutliersDisplayConfig> = {
  type: outliersDisplayType,
  icon: SearchX,
  render: (props) => <OutliersRender {...props} />,
  renderConfig: (props) => <OutliersConfig {...props} />,
};
