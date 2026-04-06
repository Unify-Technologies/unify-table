import { useMemo } from "react";
import { pivotDisplayType, isIdentityColumn, isNumericType } from "@unify/table-core";
import type { PivotDisplayConfig, PivotAgg } from "@unify/table-core";
import type { DisplayDescriptor, DisplayRenderProps, DisplayConfigProps } from "./types.js";
import { useDisplayData } from "./useDisplayData.js";
import { TableProperties } from "lucide-react";
import { selectStyle } from "./shared.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AGG_OPTIONS: PivotAgg[] = ["sum", "avg", "count", "min", "max", "median", "count_distinct"];

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "-";
  const num = Number(v);
  if (isNaN(num)) return String(v);
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

interface PivotMatrix {
  rowKeys: string[];
  colKeys: string[];
  cells: Map<string, Map<string, number>>;
  rowTotals: Map<string, number>;
  colTotals: Map<string, number>;
  grandTotal: number;
}

function buildMatrix(rows: Record<string, unknown>[]): PivotMatrix {
  const cells = new Map<string, Map<string, number>>();
  const colSet = new Set<string>();
  const rowTotals = new Map<string, number>();
  const colTotals = new Map<string, number>();
  let grandTotal = 0;

  for (const r of rows) {
    const rv = String(r.row_val ?? "(null)");
    const cv = String(r.col_val ?? "(null)");
    const val = Number(r.agg_val ?? 0);
    colSet.add(cv);

    if (!cells.has(rv)) cells.set(rv, new Map());
    cells.get(rv)!.set(cv, (cells.get(rv)!.get(cv) ?? 0) + val);
    rowTotals.set(rv, (rowTotals.get(rv) ?? 0) + val);
    colTotals.set(cv, (colTotals.get(cv) ?? 0) + val);
    grandTotal += val;
  }

  return {
    rowKeys: [...cells.keys()],
    colKeys: [...colSet],
    cells,
    rowTotals,
    colTotals,
    grandTotal,
  };
}

// ---------------------------------------------------------------------------
// Render — styled to match main table look & feel
// ---------------------------------------------------------------------------

function PivotRender({ config, sql, engine }: DisplayRenderProps<PivotDisplayConfig>) {
  const { rows, isLoading, error } = useDisplayData(sql, engine);

  const matrix = useMemo(() => {
    if (rows.length === 0) return null;
    return buildMatrix(rows);
  }, [rows]);

  if (error) return <div className="utbl-display-error">{error.message}</div>;
  if (isLoading && rows.length === 0)
    return <div className="utbl-display-loading">Loading pivot...</div>;
  if (!matrix || matrix.rowKeys.length === 0)
    return <div className="utbl-display-loading">No data</div>;

  return (
    <div className="utbl-pivot-wrap" style={{ flex: 1, overflow: "auto" }}>
      <table className="utbl-pivot-table">
        <thead>
          <tr>
            <th className="utbl-pivot-corner">
              {config.rowField} \ {config.colField}
            </th>
            {matrix.colKeys.map((ck) => (
              <th key={ck} className="utbl-pivot-col-header">
                {ck}
              </th>
            ))}
            {config.showRowTotals && (
              <th className="utbl-pivot-col-header utbl-pivot-total-header">Total</th>
            )}
          </tr>
        </thead>
        <tbody>
          {matrix.rowKeys.map((rk, ri) => (
            <tr key={rk} className={ri % 2 === 0 ? "utbl-pivot-row-even" : undefined}>
              <td className="utbl-pivot-row-header">{rk}</td>
              {matrix.colKeys.map((ck) => (
                <td key={ck} className="utbl-pivot-cell">
                  {formatValue(matrix.cells.get(rk)?.get(ck) ?? null)}
                </td>
              ))}
              {config.showRowTotals && (
                <td className="utbl-pivot-cell utbl-pivot-total">
                  {formatValue(matrix.rowTotals.get(rk))}
                </td>
              )}
            </tr>
          ))}
          {config.showColTotals && (
            <tr className="utbl-pivot-totals-row">
              <td className="utbl-pivot-row-header utbl-pivot-total">Total</td>
              {matrix.colKeys.map((ck) => (
                <td key={ck} className="utbl-pivot-cell utbl-pivot-total">
                  {formatValue(matrix.colTotals.get(ck))}
                </td>
              ))}
              {config.showRowTotals && (
                <td className="utbl-pivot-cell utbl-pivot-grand-total">
                  {formatValue(matrix.grandTotal)}
                </td>
              )}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Config panel
// ---------------------------------------------------------------------------

function PivotConfig({ config, onChange, columns }: DisplayConfigProps<PivotDisplayConfig>) {
  const cols = columns.filter((c) => !isIdentityColumn(c.name));
  const numericCols = cols.filter((c) => isNumericType(c.mappedType));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "0.625rem" }}>
      <div>
        <span className="utbl-field-label">Row Field</span>
        <select
          value={config.rowField}
          onChange={(e) => onChange({ ...config, rowField: e.target.value })}
          style={selectStyle}
        >
          <option value="">Select column...</option>
          {cols.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="utbl-field-label">Column Field</span>
        <select
          value={config.colField}
          onChange={(e) => onChange({ ...config, colField: e.target.value })}
          style={selectStyle}
        >
          <option value="">Select column...</option>
          {cols.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="utbl-field-label">Value Field</span>
        <select
          value={config.valueField}
          onChange={(e) => onChange({ ...config, valueField: e.target.value })}
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
        <span className="utbl-field-label">Aggregation</span>
        <select
          value={config.agg}
          onChange={(e) => onChange({ ...config, agg: e.target.value as PivotAgg })}
          style={selectStyle}
        >
          {AGG_OPTIONS.map((a) => (
            <option key={a} value={a}>
              {a.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="utbl-field-label">Column Limit</span>
        <input
          className="utbl-input"
          type="number"
          min={1}
          max={500}
          value={config.colLimit}
          onChange={(e) => onChange({ ...config, colLimit: Number(e.target.value) || 50 })}
          style={{ width: 70 }}
        />
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          color: "var(--utbl-text)",
        }}
      >
        <input
          type="checkbox"
          checked={config.showRowTotals}
          onChange={() => onChange({ ...config, showRowTotals: !config.showRowTotals })}
        />
        Row Totals
      </label>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          color: "var(--utbl-text)",
        }}
      >
        <input
          type="checkbox"
          checked={config.showColTotals}
          onChange={() => onChange({ ...config, showColTotals: !config.showColTotals })}
        />
        Column Totals
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Descriptor
// ---------------------------------------------------------------------------

export const pivotDisplay: DisplayDescriptor<PivotDisplayConfig> = {
  type: pivotDisplayType,
  icon: TableProperties,
  render: (props) => <PivotRender {...props} />,
  renderConfig: (props) => <PivotConfig {...props} />,
};
