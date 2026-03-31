import { Table } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined; // uses pre-loaded trades_sample table

export default function BasicTableExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();
  return (
    <Table
      db={db}
      table="trades_sample"
      styles={theme.styles}
      height="100%"
    />
  );
}
