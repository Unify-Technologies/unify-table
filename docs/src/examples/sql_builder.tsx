import { useState, useEffect, useRef } from "react";
import { select, gt, eq } from "@unify/table-core";
import type { TableConnection } from "@unify/table-core";
import { useTheme } from "../providers/ThemeProvider";
import hljs from "highlight.js/lib/core";
import sqlLang from "highlight.js/lib/languages/sql";

hljs.registerLanguage("sql", sqlLang);

export const seedSql = undefined;

const queries = {
  "Top PnL trades": select("ticker", "desk", "pnl", "volume")
    .from("trades_sample")
    .where(gt("pnl", 50))
    .orderBy("pnl", "desc")
    .limit(8),
  "AAPL trades": select("ticker", "desk", "region", "pnl", "volume")
    .from("trades_sample")
    .where(eq("ticker", "AAPL"))
    .orderBy("pnl", "desc")
    .limit(8),
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

  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.removeAttribute("data-highlighted");
      hljs.highlightElement(codeRef.current);
    }
  }, [sql]);

  const text = dark ? "#e0e0e0" : "#1e293b";
  const textMuted = dark ? "#94a3b8" : "#64748b";
  const border = dark ? "#334155" : "#e2e8f0";
  const codeBg = dark ? "#12151e" : "#eee8d5";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const textInactive = dark ? "#64748b" : "#94a3b8";
  const pillBg = dark ? "rgba(30,41,59,0.8)" : "rgba(241,245,249,0.9)";
  const pillBorder = dark ? "rgba(51,65,85,0.6)" : "rgba(203,213,225,0.7)";
  const segActiveBg = dark ? "rgba(59,130,246,0.15)" : "rgba(37,99,235,0.1)";

  const seg = (isActive: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 12px",
    fontSize: 11,
    fontWeight: isActive ? 600 : 500,
    cursor: "pointer",
    border: "none",
    borderRadius: 6,
    backgroundColor: isActive ? segActiveBg : "transparent",
    color: isActive ? accent : textInactive,
    transition: "all 0.15s ease",
  });

  return (
    <div style={{ padding: 16, height: "100%", display: "flex", flexDirection: "column", color: text, overflow: "auto" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "3px 4px", borderRadius: 9, backgroundColor: pillBg, border: `1px solid ${pillBorder}` }}>
          {(Object.keys(queries) as QueryName[]).map((name) => (
            <button key={name} onClick={() => setActive(name)} style={seg(active === name)}>
              {name}
            </button>
          ))}
        </div>
      </div>

      <pre style={{ overflow: "auto", padding: "10px 14px", borderRadius: 6, background: codeBg, margin: 0, marginBottom: 12, fontSize: 12, lineHeight: 1.6 }}>
        <code ref={codeRef} className="language-sql">{sql}</code>
      </pre>

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
