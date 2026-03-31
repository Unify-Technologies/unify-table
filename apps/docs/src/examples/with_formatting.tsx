import { Table, formatting, positive, negative, threshold } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function WithFormattingExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();
  return (
    <Table
      db={db}
      table="trades_sample"
      plugins={[
        formatting({
          pnl: [...positive("#22c55e"), ...negative("#ef4444")],
          notional: threshold([
            { max: 1000, style: { color: "#94a3b8" } },
            { max: 50000, style: { color: "#f59e0b" } },
          ]),
          volume: [
            { when: (v: unknown) => typeof v === "number" && v > 100000, style: { fontWeight: "700", color: "#8b5cf6" } },
          ],
        }),
      ]}
      styles={theme.styles}
      height="100%"
    />
  );
}
