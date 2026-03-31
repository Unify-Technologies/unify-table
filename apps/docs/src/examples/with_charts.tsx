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
    y: { field: "total_pnl", agg: "sum" },
    theme,
  });

  const pieOption = buildPieOption(data, {
    type: "pie",
    x: "ticker",
    y: { field: "trades", agg: "sum" },
    theme,
  });

  const option = chartType === "bar" ? barOption : pieOption;

  const btnBase = "px-3 py-1 text-xs font-medium rounded cursor-pointer transition-colors";
  const btnActive = dark ? "bg-[#3b82f6] text-white" : "bg-[#2563eb] text-white";
  const btnInactive = dark ? "bg-[#1e293b] text-[#94a3b8]" : "bg-[#f1f5f9] text-[#64748b]";

  return (
    <div style={{ padding: 16, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button className={`${btnBase} ${chartType === "bar" ? btnActive : btnInactive}`} onClick={() => setChartType("bar")}>
          Bar — PnL by Ticker
        </button>
        <button className={`${btnBase} ${chartType === "pie" ? btnActive : btnInactive}`} onClick={() => setChartType("pie")}>
          Pie — Trade Count
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <EChartsWrapper option={option} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}
