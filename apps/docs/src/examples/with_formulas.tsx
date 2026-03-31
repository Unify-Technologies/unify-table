import { useEffect } from "react";
import { Table, formulas, addFormulaColumn, removeFormulaColumn, filters, columnResize } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function WithFormulasExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();

  useEffect(() => {
    addFormulaColumn("pnl_per_unit", "ROUND(pnl / NULLIF(volume, 0), 4)");
    addFormulaColumn("trade_year", "DATE_PART('year', trade_date)::INTEGER");
    return () => {
      removeFormulaColumn("pnl_per_unit");
      removeFormulaColumn("trade_year");
    };
  }, []);

  return (
    <Table
      db={db}
      table="trades_sample"
      plugins={[formulas(), filters(), columnResize()]}
      styles={theme.styles}
      columns={[
        { field: "ticker", label: "Ticker", width: 100 },
        { field: "pnl", label: "PnL", width: 110, align: "right" as const },
        { field: "volume", label: "Volume", width: 110, align: "right" as const },
        { field: "notional", label: "Notional", width: 130, align: "right" as const },
        { field: "pnl_per_unit", label: "PnL/Unit", width: 120, align: "right" as const },
        { field: "trade_year", label: "Year", width: 80, align: "right" as const },
      ]}
      height="100%"
    />
  );
}
