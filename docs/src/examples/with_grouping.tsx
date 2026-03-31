import { Table, rowGrouping, filters } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function WithGroupingExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();
  return (
    <Table
      db={db}
      table="trades_sample"
      plugins={[rowGrouping(), filters()]}
      styles={theme.styles}
      initialGroupBy={["desk", "ticker"]}
      height="100%"
    />
  );
}
