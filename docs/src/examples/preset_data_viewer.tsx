import { Table, dataViewer, formatting, positive, negative } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function PresetDataViewerExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();
  return (
    <Table
      db={db}
      table="trades_sample"
      plugins={[
        ...dataViewer(),
        formatting({
          pnl: [...positive("#22c55e"), ...negative("#ef4444")],
        }),
      ]}
      styles={theme.styles}
      height="100%"
      displays={[
        {
          id: "pnl-chart",
          type: "chart",
          label: "PnL by Ticker",
          config: {
            type: "bar",
            x: "ticker",
            y: { field: "pnl", agg: "sum" },
            sort: "value",
          },
        },
        {
          id: "pnl-timeline",
          type: "timeline",
          label: "PnL Over Time",
          config: {
            dateField: "trade_date",
            bucket: "month",
            agg: "sum",
            valueField: "pnl",
            chartType: "area",
            series: "desk",
          },
        },
        {
          id: "ticker-region",
          type: "pivot",
          label: "Ticker x Region",
          config: {
            rowField: "ticker",
            colField: "region",
            valueField: "pnl",
            agg: "sum",
            showRowTotals: true,
            showColTotals: true,
          },
        },
      ]}
      initialActiveDisplay="pnl-chart"
    />
  );
}
