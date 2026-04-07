import { useCallback, useState } from "react";
import { quoteIdent } from "@unify/table-core";
import type { TableContext } from "../types.js";
import { detectIdColumn, downloadBlob } from "../utils.js";

type ExportSource = "all" | "selection" | "filtered";
type ExportFormat = "csv" | "json" | "parquet";

export function ExportPanel({ ctx }: { ctx: TableContext }) {
  const [source, setSource] = useState<ExportSource>("all");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const selectionOnly = source === "selection";
      const filename = `${ctx.table}.${format}`;

      if (selectionOnly && ctx.selection.groupCount > 0) {
        // Export rows matching selected group keys
        const conditions: string[] = [];
        for (const serialized of ctx.selection.selectedGroups) {
          const entries: [string, unknown][] = JSON.parse(serialized);
          const clause = entries
            .map(([field, value]) => {
              if (value === null || value === undefined) return `${quoteIdent(field)} IS NULL`;
              const n = Number(value);
              const literal = Number.isNaN(n) ? `'${String(value).replace(/'/g, "''")}'` : String(n);
              return `${quoteIdent(field)} = ${literal}`;
            })
            .join(" AND ");
          conditions.push(`(${clause})`);
        }
        const where = conditions.join(" OR ");
        const tmpTable = `__export_${Date.now()}`;
        await ctx.engine.execute(
          `CREATE TEMP TABLE ${quoteIdent(tmpTable)} AS SELECT * FROM ${quoteIdent(ctx.table)} WHERE ${where}`,
        );
        const blob = await ctx.engine.exportBlob(tmpTable, format);
        await ctx.engine.execute(`DROP TABLE IF EXISTS ${quoteIdent(tmpTable)}`);
        downloadBlob(blob, filename);
      } else if (selectionOnly && ctx.selection.selectedIds.size > 0) {
        const ids = [...ctx.selection.selectedIds];
        const idCol = detectIdColumn(ctx.columns);
        const idList = ids
          .map((id) => {
            const n = Number(id);
            return Number.isNaN(n) ? `'${String(id).replace(/'/g, "''")}'` : String(n);
          })
          .join(",");

        const tmpTable = `__export_${Date.now()}`;
        await ctx.engine.execute(
          `CREATE TEMP TABLE ${quoteIdent(tmpTable)} AS SELECT * FROM ${quoteIdent(ctx.table)} WHERE ${quoteIdent(idCol)} IN (${idList})`,
        );
        const blob = await ctx.engine.exportBlob(tmpTable, format);
        await ctx.engine.execute(`DROP TABLE IF EXISTS ${quoteIdent(tmpTable)}`);
        downloadBlob(blob, filename);
      } else {
        const blob = await ctx.engine.exportBlob(ctx.table, format);
        downloadBlob(blob, filename);
      }
    } finally {
      setExporting(false);
    }
  }, [source, format, ctx]);

  const selSpan = ctx.selection.span;
  const selRows = selSpan ? Math.abs(selSpan.focus.row - selSpan.anchor.row) + 1 : 0;
  const selCols = selSpan ? Math.abs(selSpan.focus.col - selSpan.anchor.col) + 1 : 0;
  const totalCols = ctx.columns.length;
  const noSelection = ctx.selection.count === 0 && ctx.selection.groupCount === 0;

  const sources: { key: ExportSource; label: string; dims: string }[] = [
    { key: "all", label: "All", dims: `${ctx.totalCount.toLocaleString()} \u00D7 ${totalCols}` },
    {
      key: "selection",
      label: "Selection",
      dims:
        ctx.selection.groupCount > 0
          ? `${ctx.selection.groupCount} group${ctx.selection.groupCount > 1 ? "s" : ""}`
          : selRows > 0
            ? `${selRows.toLocaleString()} \u00D7 ${selCols}`
            : "0",
    },
    {
      key: "filtered",
      label: "Filtered",
      dims: `${ctx.totalCount.toLocaleString()} \u00D7 ${totalCols}`,
    },
  ];

  const formats: { key: ExportFormat; label: string }[] = [
    { key: "csv", label: "CSV" },
    { key: "json", label: "JSON" },
    { key: "parquet", label: "Parquet" },
  ];

  return (
    <div className="utbl-panel-section utbl-space-y">
      {/* Source */}
      <div className="utbl-space-y-sm">
        <span className="utbl-field-label">Source</span>
        {sources.map((s) => (
          <label
            key={s.key}
            className="utbl-radio-row"
            data-disabled={s.key === "selection" && noSelection}
          >
            <input
              type="radio"
              className="utbl-radio"
              name={`export-source-${ctx.table}`}
              checked={source === s.key}
              onChange={() => setSource(s.key)}
              disabled={s.key === "selection" && noSelection}
            />
            {s.label}
            <span className="utbl-radio-dims">{s.dims}</span>
          </label>
        ))}
      </div>

      {/* Format */}
      <div className="utbl-space-y-sm">
        <span className="utbl-field-label">Format</span>
        <div className="utbl-toggle-group">
          {formats.map((f) => (
            <button
              key={f.key}
              className="utbl-toggle-btn"
              data-active={format === f.key}
              onClick={() => setFormat(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Download */}
      <button
        className="utbl-btn"
        onClick={handleExport}
        disabled={exporting || (source === "selection" && noSelection)}
      >
        {exporting ? "Exporting..." : "Download"}
      </button>
    </div>
  );
}
