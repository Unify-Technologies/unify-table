import { useState } from "react";
import { Table } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { useDocTheme } from "./useDocTheme";
import { useTheme } from "../providers/ThemeProvider";

export const seedSql = undefined;

export default function DensityComparisonExample({ db }: { db: TableConnection }) {
  const theme = useDocTheme();
  const { dark } = useTheme();
  const [density, setDensity] = useState<"compact" | "comfortable" | "spacious">("comfortable");

  const accent = dark ? "#3b82f6" : "#2563eb";
  const textInactive = dark ? "#64748b" : "#94a3b8";
  const pillBg = dark ? "rgba(30,41,59,0.8)" : "rgba(241,245,249,0.9)";
  const pillBorder = dark ? "rgba(51,65,85,0.6)" : "rgba(203,213,225,0.7)";
  const segActiveBg = dark ? "rgba(59,130,246,0.15)" : "rgba(37,99,235,0.1)";

  const seg = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 12px",
    fontSize: 11,
    fontWeight: active ? 600 : 500,
    cursor: "pointer",
    border: "none",
    borderRadius: 6,
    backgroundColor: active ? segActiveBg : "transparent",
    color: active ? accent : textInactive,
    transition: "all 0.15s ease",
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "center", padding: "6px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "3px 4px", borderRadius: 9, backgroundColor: pillBg, border: `1px solid ${pillBorder}` }}>
          {(["compact", "comfortable", "spacious"] as const).map((d) => (
            <button key={d} onClick={() => setDensity(d)} style={seg(density === d)}>
              {d}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Table db={db} table="trades_sample" density={density} styles={theme.styles} height="100%" />
      </div>
    </div>
  );
}
