import { Table, readOnly, formatting, positive, negative, threshold } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function PresetReadOnlyExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();
  return (
    <Table
      db={db}
      table="trades_sample"
      plugins={[
        ...readOnly(),
        formatting({
          pnl: [...positive("#22c55e"), ...negative("#ef4444")],
          notional: threshold([
            { max: 1000, style: { color: "#94a3b8" } },
            { max: 50000, style: { color: "#f59e0b" } },
          ]),
        }),
      ]}
      styles={theme.styles}
      initialSort={[{ field: "pnl", dir: "desc" }]}
      height="100%"
    />
  );
}
