import { Table, dataViewer } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function DisplayChartExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();
  return (
    <Table
      db={db}
      table="trades_sample"
      plugins={dataViewer()}
      styles={theme.styles}
      height="100%"
      displays={[
        {
          id: "pnl-by-ticker",
          type: "chart",
          label: "PnL by Ticker",
          config: {
            type: "bar",
            x: "ticker",
            y: { field: "pnl", agg: "sum" },
            sort: "value",
          },
        },
      ]}
      initialActiveDisplay="pnl-by-ticker"
    />
  );
}
