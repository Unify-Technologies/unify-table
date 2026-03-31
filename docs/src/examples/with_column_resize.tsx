import { Table, columnResize } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function WithColumnResizeExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();
  return (
    <Table
      db={db}
      table="trades_sample"
      plugins={[columnResize()]}
      styles={theme.styles}
      columns={[
        { field: "ticker", label: "Ticker", width: 100 },
        { field: "pnl", label: "PnL", width: 120, align: "right" as const },
        { field: "region", label: "Region", width: 120 },
        { field: "desk", label: "Desk", width: 100 },
        { field: "trade_date", label: "Trade Date", width: 140 },
        { field: "volume", label: "Volume", width: 120, align: "right" as const },
        { field: "notional", label: "Notional", width: 150, align: "right" as const },
      ]}
      height="100%"
    />
  );
}
