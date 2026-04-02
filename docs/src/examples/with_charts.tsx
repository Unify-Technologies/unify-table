import { useState, useEffect } from "react";
import { EChartsWrapper, buildBarLineOption, buildPieOption, DARK_CHART_THEME, LIGHT_CHART_THEME } from "@unify/table-charts";
import type { TableConnection } from "@unify/table-core";
import { useTheme } from "../providers/ThemeProvider";

export const seedSql = undefined;

export default function WithChartsExample({ db }: { db: TableConnection }) {
  const { dark } = useTheme();
  const [data, setData] = useState<Record<string, unknown>[] | null>(null);
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");

  useEffect(() => {
    db.runAndRead(
      `SELECT ticker, ROUND(SUM(pnl), 2) AS total_pnl, COUNT(*) AS trades
       FROM trades_sample GROUP BY ticker ORDER BY total_pnl DESC`
    ).then(setData);
  }, [db]);

  if (!data) return null;

  const theme = dark ? DARK_CHART_THEME : LIGHT_CHART_THEME;

  const barOption = buildBarLineOption(data, {
    type: "bar",
    x: "ticker",
    y: { field: "total_pnl", agg: "sum", label: "total_pnl" },
    theme,
  });

  const pieOption = buildPieOption(data, {
    type: "pie",
    x: "ticker",
    y: { field: "trades", agg: "sum", label: "trades" },
    theme,
  });

  const option = chartType === "bar" ? barOption : pieOption;

  const accent = dark ? "#3b82f6" : "#2563eb";
  const textInactive = dark ? "#64748b" : "#94a3b8";
  const pillBg = dark ? "rgba(30,41,59,0.8)" : "rgba(241,245,249,0.9)";
  const pillBorder = dark ? "rgba(51,65,85,0.6)" : "rgba(203,213,225,0.7)";
  const segActiveBg = dark ? "rgba(59,130,246,0.15)" : "rgba(37,99,235,0.1)";

  const seg = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 12px",
    fontSize: 11,
    fontWeight: active ? 600 : 500,
    cursor: "pointer",
    border: "none",
    borderRadius: 6,
    backgroundColor: active ? segActiveBg : "transparent",
    color: active ? accent : textInactive,
    transition: "all 0.15s ease",
  });

  return (
    <div style={{ padding: 16, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "3px 4px", borderRadius: 9, backgroundColor: pillBg, border: `1px solid ${pillBorder}` }}>
          <button onClick={() => setChartType("bar")} style={seg(chartType === "bar")}>
            Bar — PnL by Ticker
          </button>
          <button onClick={() => setChartType("pie")} style={seg(chartType === "pie")}>
            Pie — Trade Count
          </button>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <EChartsWrapper option={option} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}
