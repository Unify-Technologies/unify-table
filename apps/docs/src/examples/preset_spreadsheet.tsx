import { Table, spreadsheet, formatting, positive, negative } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function PresetSpreadsheetExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();
  return (
    <Table
      db={db}
      table="trades_sample"
      plugins={[
        ...spreadsheet(),
        formatting({
          pnl: [...positive("#22c55e"), ...negative("#ef4444")],
        }),
      ]}
      styles={theme.styles}
      columns={[
        { field: "ticker", label: "Ticker", width: 100, editor: "select", editorOptions: ["AAPL", "MSFT", "GOOG", "AMZN", "META"] },
        { field: "pnl", label: "PnL", width: 120, align: "right" as const, editor: "number" },
        { field: "desk", label: "Desk", width: 110, editor: "select", editorOptions: ["Trading", "Sales", "Research"] },
        { field: "region", label: "Region", width: 110, editor: "select", editorOptions: ["US", "EMEA", "APAC", "LATAM", "Canada", "MEA", "Nordics"] },
        { field: "trade_date", label: "Trade Date", width: 130 },
        { field: "volume", label: "Volume", width: 110, align: "right" as const, editor: "number", validate: (v: unknown) => Number(v) > 0 || "Must be positive" },
        { field: "notional", label: "Notional", width: 140, align: "right" as const },
      ]}
      height="100%"
    />
  );
}
