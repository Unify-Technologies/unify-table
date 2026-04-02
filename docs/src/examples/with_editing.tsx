import { Table, editing, keyboard, selection } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function WithEditingExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();
  return (
    <Table
      db={db}
      table="trades_sample"
      plugins={[editing(), keyboard(), selection("range")]}
      styles={theme.styles}
      columns={[
        { field: "ticker", label: "Ticker", editor: "select", editorOptions: ["AAPL", "MSFT", "GOOG", "AMZN", "META"] },
        { field: "pnl", label: "PnL", align: "right" as const, editor: "number", validate: (v: unknown) => typeof v === "number" || "Must be a number" },
        { field: "desk", label: "Desk", editor: "select", editorOptions: ["Trading", "Sales", "Research"] },
        { field: "region", label: "Region", editor: "select", editorOptions: ["US", "EMEA", "APAC", "LATAM", "Canada", "MEA", "Nordics"], editorFreeform: true },
        { field: "volume", label: "Volume", align: "right" as const, editor: "number", validate: (v: unknown) => Number(v) > 0 || "Must be positive" },
      ]}
      height="100%"
    />
  );
}
