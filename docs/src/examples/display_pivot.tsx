import { Table, dataViewer } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function DisplayPivotExample({ db }: { db: TableConnection }) {
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
          id: "ticker-region",
          type: "pivot",
          label: "Ticker x Region",
          config: {
            rowField: "ticker",
            colField: "region",
            valueField: "pnl",
            agg: "sum",
            colLimit: 50,
            showRowTotals: true,
            showColTotals: true,
          },
        },
      ]}
      initialActiveDisplay="ticker-region"
    />
  );
}
