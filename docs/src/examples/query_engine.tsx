import { useState, useEffect } from "react";
import { createQueryEngine } from "@unify/table-core";
import type { TableConnection, ColumnInfo } from "@unify/table-core";
import { useTheme } from "../providers/ThemeProvider";

export const seedSql = undefined;

export default function QueryEngineExample({ db }: { db: TableConnection }) {
  const { dark } = useTheme();
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [desks, setDesks] = useState<string[]>([]);
  const [topTrades, setTopTrades] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    const engine = createQueryEngine(db);
    Promise.all([
      engine.columns("trades_sample"),
      engine.count("trades_sample"),
      engine.distinct("trades_sample", "desk"),
      engine.query("SELECT ticker, desk, pnl FROM trades_sample ORDER BY pnl DESC LIMIT 5"),
    ]).then(([cols, cnt, dists, rows]) => {
      setColumns(cols);
      setTotalCount(cnt);
      setDesks(dists.map((d) => String(d)));
      setTopTrades(rows);
    });
  }, [db]);

  const text = dark ? "var(--color-dark-text)" : "var(--color-text)";
  const textMuted = dark ? "var(--color-dark-text-muted)" : "var(--color-text-muted)";
  const textSecondary = dark ? "var(--color-dark-text-secondary)" : "var(--color-text-secondary)";
  const border = dark ? "var(--color-dark-border)" : "var(--color-border)";
  const accent = dark ? "var(--color-dark-accent)" : "var(--color-accent)";
  const codeBg = dark ? "#12151e" : "#eee8d5";
  const tagBg = dark ? "rgba(59,130,246,0.08)" : "rgba(37,99,235,0.06)";
  const tagBorder = dark ? "rgba(59,130,246,0.2)" : "rgba(37,99,235,0.15)";

  const label = (code: string): React.CSSProperties => ({
    fontSize: 11,
    fontFamily: "monospace",
    padding: "3px 8px",
    borderRadius: 4,
    background: codeBg,
    color: textSecondary,
    marginBottom: 8,
    display: "inline-block",
  });

  return (
    <div style={{ padding: 16, height: "100%", overflow: "auto", color: text }}>
      {/* count + distinct row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, paddingBottom: 14, borderBottom: `1px solid ${border}` }}>
        <div>
          <div style={label("count")}>.count("trades_sample")</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>{totalCount.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: textMuted }}>total rows</div>
        </div>
        <div>
          <div style={label("distinct")}>.distinct("trades_sample", "desk")</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
            {desks.map((d) => (
              <span key={d} style={{ fontSize: 12, padding: "2px 10px", borderRadius: 4, border: `1px solid ${tagBorder}`, background: tagBg, color: textSecondary }}>{d}</span>
            ))}
          </div>
        </div>
      </div>

      {/* columns */}
      <div style={{ paddingTop: 14, paddingBottom: 14, borderBottom: `1px solid ${border}` }}>
        <div style={label("columns")}>.columns("trades_sample")</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {columns.map((c) => (
            <span key={c.name} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: `1px solid ${tagBorder}`, background: tagBg, fontFamily: "monospace", color: textSecondary }}>
              {c.name} <span style={{ color: textMuted }}>{c.type}</span>
            </span>
          ))}
        </div>
      </div>

      {/* query */}
      <div style={{ paddingTop: 14 }}>
        <div style={label("query")}>.query("SELECT ... ORDER BY pnl DESC LIMIT 5")</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {topTrades[0] && Object.keys(topTrades[0]).map((col) => (
                <th key={col} style={{ textAlign: "left", padding: "4px 10px", borderBottom: `1px solid ${border}`, fontSize: 11, color: textMuted, fontWeight: 600 }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topTrades.map((row, i) => (
              <tr key={i}>
                {Object.values(row).map((val, j) => (
                  <td key={j} style={{ padding: "4px 10px", borderBottom: `1px solid ${border}`, fontSize: 12 }}>
                    {val == null ? "—" : String(val)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
