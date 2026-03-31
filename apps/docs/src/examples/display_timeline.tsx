import { Table, dataViewer } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function DisplayTimelineExample({ db }: { db: TableConnection }) {
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
      ]}
      initialActiveDisplay="pnl-timeline"
    />
  );
}
