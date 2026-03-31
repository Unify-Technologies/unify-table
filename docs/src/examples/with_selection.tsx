import { Table, selection, keyboard, statusBar } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function WithSelectionExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();
  return (
    <Table
      db={db}
      table="trades_sample"
      plugins={[selection("range"), keyboard(), statusBar()]}
      styles={theme.styles}
      height="100%"
    />
  );
}
