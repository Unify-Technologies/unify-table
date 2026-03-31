import { Table, findReplace, editing, keyboard, selection } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function WithFindReplaceExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();
  return (
    <Table
      db={db}
      table="trades_sample"
      plugins={[findReplace(), editing(), keyboard(), selection("range")]}
      styles={theme.styles}
      columns={[
        { field: "ticker", label: "Ticker", width: 100, editor: "text" },
        { field: "desk", label: "Desk", width: 120, editor: "text" },
        { field: "region", label: "Region", width: 110, editor: "text" },
        { field: "pnl", label: "PnL", width: 120, align: "right" as const },
        { field: "volume", label: "Volume", width: 110, align: "right" as const },
      ]}
      height="100%"
    />
  );
}
