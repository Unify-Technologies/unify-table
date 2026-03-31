import { Table, selection, statusBar, formatting, positive, negative } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function WithStatusBarExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();
  return (
    <Table
      db={db}
      table="trades_sample"
      plugins={[
        selection("range"),
        statusBar(),
        formatting({
          pnl: [...positive("#22c55e"), ...negative("#ef4444")],
        }),
      ]}
      styles={theme.styles}
      height="100%"
    />
  );
}
