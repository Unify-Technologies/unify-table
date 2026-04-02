import { Table, formulas, spreadsheet } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function WithFormulasExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();

  return (
    <Table
      db={db}
      table="trades_sample"
      plugins={[
        ...spreadsheet(),
        formulas({
          columns: [
            { name: "pnl_per_unit", expression: "ROUND(pnl / NULLIF(volume, 0), 4)", label: "PnL/Unit", align: "right", width: 120, editable: true },
            { name: "trade_year", expression: "DATE_PART('year', trade_date)::INTEGER", label: "Year", align: "right", width: 80 },
            { name: "margin_pct", expression: "ROUND(pnl / NULLIF(notional, 0) * 100, 2)", label: "Margin %", align: "right", width: 100, format: "number", editable: true },
          ],
        }),
      ]}
      styles={theme.styles}
      columns={[
        { field: "ticker", label: "Ticker", width: 100 },
        { field: "pnl", label: "PnL", width: 110, align: "right" as const, editor: "number", format: "number" },
        { field: "volume", label: "Volume", width: 110, align: "right" as const, editor: "number" },
        { field: "notional", label: "Notional", width: 130, align: "right" as const, editor: "number", format: "number" },
        { field: "pnl_per_unit", label: "PnL/Unit", width: 120, align: "right" as const },
        { field: "trade_year", label: "Year", width: 80, align: "right" as const },
        { field: "margin_pct", label: "Margin %", width: 100, align: "right" as const },
      ]}
      height="100%"
    />
  );
}
