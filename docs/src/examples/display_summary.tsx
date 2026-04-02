import { Table, dataViewer } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function DisplaySummaryExample({ db }: { db: TableConnection }) {
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
          id: "summary",
          type: "summary",
          label: "Data Profile",
          config: {
            excludeColumns: [],
            showDistributions: true,
            histogramBins: 20,
          },
        },
      ]}
      initialActiveDisplay="summary"
    />
  );
}
