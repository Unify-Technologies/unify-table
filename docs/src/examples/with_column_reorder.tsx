import { Table, columnReorder, columnResize } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function WithColumnReorderExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();
  return (
    <Table
      db={db}
      table="trades_sample"
      plugins={[columnReorder(), columnResize()]}
      styles={theme.styles}
      height="100%"
    />
  );
}
