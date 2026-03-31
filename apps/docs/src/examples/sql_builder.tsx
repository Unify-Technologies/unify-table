import { useState, useEffect } from "react";
import { select, gt, eq } from "@unify/table-core";
import type { TableConnection } from "@unify/table-core";
import { useTheme } from "../providers/ThemeProvider";

export const seedSql = undefined;

const queries = {
  "Top PnL trades": select("ticker", "desk", "pnl", "volume")
    .from("trades_sample")
    .where(gt("pnl", 5000))
    .orderBy("pnl", "desc")
    .limit(8),
  "AAPL summary": select("desk", "COUNT(*) AS trades", "ROUND(SUM(pnl), 2) AS total_pnl", "ROUND(AVG(pnl), 2) AS avg_pnl")
    .from("trades_sample")
    .where(eq("ticker", "AAPL"))
    .groupBy("desk")
    .orderBy("total_pnl", "desc"),
  "Volume leaders": select("ticker", "region", "volume", "notional")
    .from("trades_sample")
    .where(gt("volume", 900))
    .orderBy("volume", "desc")
    .limit(8),
};

type QueryName = keyof typeof queries;

export default function SqlBuilderExample({ db }: { db: TableConnection }) {
  const { dark } = useTheme();
  const [active, setActive] = useState<QueryName>("Top PnL trades");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [sql, setSql] = useState("");

  useEffect(() => {
    const q = queries[active];
    const s = q.sql();
    setSql(s);
    db.runAndRead(s).then(setRows);
  }, [active, db]);

  const text = dark ? "#e0e0e0" : "#1e293b";
  const textMuted = dark ? "#94a3b8" : "#64748b";
  const border = dark ? "#334155" : "#e2e8f0";
  const surface = dark ? "#0f172a" : "#f8fafc";
  const btnActive = dark ? "bg-[#3b82f6] text-white" : "bg-[#2563eb] text-white";
  const btnInactive = dark ? "bg-[#1e293b] text-[#94a3b8]" : "bg-[#f1f5f9] text-[#64748b]";

  return (
    <div style={{ padding: 16, height: "100%", display: "flex", flexDirection: "column", color: text, overflow: "auto" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {(Object.keys(queries) as QueryName[]).map((name) => (
          <button
            key={name}
            className={`px-3 py-1 text-xs font-medium rounded cursor-pointer transition-colors ${active === name ? btnActive : btnInactive}`}
            onClick={() => setActive(name)}
          >
            {name}
          </button>
        ))}
      </div>

      <pre
        style={{
          fontSize: 12,
          fontFamily: "monospace",
          padding: 12,
          borderRadius: 6,
          background: surface,
          border: `1px solid ${border}`,
          color: textMuted,
          marginBottom: 12,
          whiteSpace: "pre-wrap",
          lineHeight: 1.6,
        }}
      >{sql}</pre>

      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {rows[0] && Object.keys(rows[0]).map((col) => (
                <th key={col} style={{ textAlign: "left", padding: "6px 12px", borderBottom: `1px solid ${border}`, fontSize: 11, color: textMuted, fontWeight: 600 }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {Object.values(row).map((val, j) => (
                  <td key={j} style={{ padding: "5px 12px", borderBottom: `1px solid ${border}`, fontSize: 12 }}>
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
