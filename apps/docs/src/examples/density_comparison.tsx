import { useState } from "react";
import { Table } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";

export const seedSql = undefined;

export default function DensityComparisonExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();
  const [density, setDensity] = useState<"compact" | "comfortable" | "spacious">("comfortable");

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 8, padding: "8px 0", flexShrink: 0 }}>
        {(["compact", "comfortable", "spacious"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDensity(d)}
            style={{
              padding: "4px 12px",
              borderRadius: 6,
              fontSize: 12,
              cursor: "pointer",
              border: "1px solid var(--doc-border)",
              backgroundColor: density === d ? "var(--doc-accent)" : "transparent",
              color: density === d ? "#fff" : "var(--doc-text-secondary)",
            }}
          >
            {d}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Table db={db} table="trades_sample" density={density} styles={theme.styles} height="100%" />
      </div>
    </div>
  );
}
