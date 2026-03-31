import { Table, filters } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function WithFiltersExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();
  return (
    <Table
      db={db}
      table="trades_sample"
      plugins={[filters()]}
      styles={theme.styles}
      initialFilterValues={{ ticker: "AAPL", pnl: "> 0" }}
      height="100%"
    />
  );
}
