import { Table, dataViewer } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function DisplayOutliersExample({ db }: { db: TableConnection }) {
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
          id: "outliers",
          type: "outliers",
          label: "Notional Outliers",
          config: {
            field: "notional",
            method: "iqr",
            threshold: 1.5,
            labelField: "ticker",
            limit: 50,
          },
        },
      ]}
      initialActiveDisplay="outliers"
    />
  );
}
