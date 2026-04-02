import { useState } from "react";
import { Table, darkTheme, lightTheme } from "@unify/table-react";
import type { TableConnection } from "@unify/table-core";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../providers/ThemeProvider";

export const seedSql = undefined;

export default function ThemeToggleExample({ db }: { db: TableConnection }) {
  const { dark: docDark } = useTheme();
  const [dark, setDark] = useState(true);
  const theme = dark ? darkTheme : lightTheme;

  // Toggle pill follows the *doc* theme, not the example's internal state
  const accent = docDark ? "#3b82f6" : "#2563eb";
  const textInactive = docDark ? "#64748b" : "#94a3b8";
  const pillBg = docDark ? "rgba(30,41,59,0.8)" : "rgba(241,245,249,0.9)";
  const pillBorder = docDark ? "rgba(51,65,85,0.6)" : "rgba(203,213,225,0.7)";
  const segActiveBg = docDark ? "rgba(59,130,246,0.15)" : "rgba(37,99,235,0.1)";

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            padding: "3px 4px",
            borderRadius: 9,
            backgroundColor: pillBg,
            border: `1px solid ${pillBorder}`,
          }}
        >
          <button onClick={() => setDark(true)} style={seg(dark)}>
            <Moon size={12} /> Dark
          </button>
          <button onClick={() => setDark(false)} style={seg(!dark)}>
            <Sun size={12} /> Light
          </button>
        </div>
      </div>
      <div
        className={theme.containerClass}
        style={{ flex: 1, minHeight: 0, borderRadius: 0, border: "none", boxShadow: "none", ...theme.panelVars } as React.CSSProperties}
      >
        <Table db={db} table="trades_sample" styles={theme.styles} height="100%" />
      </div>
    </div>
  );
}
