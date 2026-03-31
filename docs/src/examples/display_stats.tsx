import { Table, dataViewer } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function DisplayStatsExample({ db }: { db: TableConnection }) {
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
          id: "trade-stats",
          type: "stats",
          label: "Trade KPIs",
          config: {
            fields: [
              { field: "pnl", aggs: ["sum", "avg", "min", "max"] },
              { field: "volume", aggs: ["sum", "avg"] },
              { field: "notional", aggs: ["sum", "avg"] },
            ],
            layout: "row",
          },
        },
      ]}
      initialActiveDisplay="trade-stats"
    />
  );
}
