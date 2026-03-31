import { Table, columnPin, columnResize } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function WithColumnPinExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();
  return (
    <Table
      db={db}
      table="trades_sample"
      plugins={[columnPin(), columnResize()]}
      styles={theme.styles}
      columns={[
        { field: "ticker", label: "Ticker", pin: "left", width: 100 },
        { field: "desk", label: "Desk", width: 120 },
        { field: "region", label: "Region", width: 120 },
        { field: "trade_date", label: "Trade Date", width: 140 },
        { field: "volume", label: "Volume", width: 130, align: "right" as const },
        { field: "notional", label: "Notional", width: 160, align: "right" as const },
        { field: "pnl", label: "PnL", pin: "right", width: 120, align: "right" as const },
      ]}
      height="100%"
    />
  );
}
