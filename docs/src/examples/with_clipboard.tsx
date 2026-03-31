import { Table, clipboard, selection, keyboard, editing } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function WithClipboardExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();
  return (
    <Table
      db={db}
      table="trades_sample"
      plugins={[clipboard(), selection("range"), keyboard(), editing()]}
      styles={theme.styles}
      height="100%"
    />
  );
}
