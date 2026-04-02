import { Table, dataViewer } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function DisplayCorrelationExample({ db }: { db: TableConnection }) {
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
          id: "corr",
          type: "correlation",
          label: "Correlation Matrix",
          config: {
            selectedColumns: ["pnl", "volume", "notional"],
            maxAutoColumns: 20,
            highlightThreshold: 0.5,
            showValues: true,
            colorScheme: "diverging",
          },
        },
      ]}
      initialActiveDisplay="corr"
    />
  );
}
