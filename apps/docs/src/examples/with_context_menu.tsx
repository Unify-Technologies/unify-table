import { Table, contextMenu, selection, clipboard, filters } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function WithContextMenuExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();
  return (
    <Table
      db={db}
      table="trades_sample"
      plugins={[contextMenu(), selection("multi"), clipboard(), filters()]}
      styles={theme.styles}
      height="100%"
    />
  );
}
