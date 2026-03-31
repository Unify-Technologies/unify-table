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

  const text = dark ? "#e0e0e0" : "#1e293b";
  const textMuted = dark ? "#94a3b8" : "#64748b";
  const border = dark ? "#334155" : "#e2e8f0";
  const surface = dark ? "#1e293b" : "#f1f5f9";
  const cardBg = dark ? "#0f172a" : "#ffffff";

  const cardStyle: React.CSSProperties = {
    padding: 12,
    borderRadius: 8,
    border: `1px solid ${border}`,
    background: cardBg,
  };

  return (
    <div style={{ padding: 16, height: "100%", overflow: "auto", color: text }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, fontWeight: 600, color: textMuted, marginBottom: 6 }}>engine.count("trades_sample")</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{totalCount.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: textMuted }}>total rows</div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 11, fontWeight: 600, color: textMuted, marginBottom: 6 }}>engine.distinct("trades_sample", "desk")</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
            {desks.map((d) => (
              <span key={d} style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: surface }}>{d}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: textMuted, marginBottom: 8 }}>engine.columns("trades_sample")</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {columns.map((c) => (
            <span key={c.name} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: surface, fontFamily: "monospace" }}>
              {c.name} <span style={{ color: textMuted }}>{c.type}</span>
            </span>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 11, fontWeight: 600, color: textMuted, marginBottom: 8 }}>engine.query("SELECT ... ORDER BY pnl DESC LIMIT 5")</div>
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
