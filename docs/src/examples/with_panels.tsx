import { Table, dataViewer, formatting, positive, negative } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function WithPanelsExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();
  return (
    <Table
      db={db}
      table="trades_sample"
      plugins={[
        ...dataViewer(),
        formatting({
          pnl: [...positive("#22c55e"), ...negative("#ef4444")],
        }),
      ]}
      styles={theme.styles}
      columns={[
        { field: "ticker", label: "Ticker", width: 100 },
        { field: "desk", label: "Desk", width: 120 },
        { field: "region", label: "Region", width: 110 },
        { field: "pnl", label: "PnL", width: 120, align: "right" as const },
        { field: "volume", label: "Volume", width: 110, align: "right" as const },
        { field: "notional", label: "Notional", width: 140, align: "right" as const },
        { field: "trade_date", label: "Trade Date", width: 130 },
      ]}
      height="100%"
    />
  );
}
