import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useDB } from "../providers/DuckDBProvider";
import { useTheme } from "../providers/ThemeProvider";
import { useExampleData } from "../providers/useExampleData";
import { TRADES_SQL } from "../data";
import { Link } from "../router";
import { DemoContext } from "./demo/DemoContext";
import { DockLayout } from "./demo/DockLayout";
import "dockview/dist/styles/dockview.css";

const PILLS = [
  "15 Plugins",
  "7 Displays",
  "Row Grouping",
  "Charts",
  "Filters",
  "Selection",
  "Formatting",
  "Clipboard",
  "1M Rows",
];

const DOC_LINKS: { label: string; to: string }[] = [
  { label: "Plugins", to: "/plugins" },
  { label: "Displays", to: "/displays" },
  { label: "Getting Started", to: "/getting-started" },
];

function DemoBanner({ dark }: { dark: boolean }) {
  const [expanded, setExpanded] = useState(true);

  const bg = dark ? "var(--doc-surface)" : "var(--color-surface)";
  const border = dark ? "var(--doc-border)" : "var(--color-border)";
  const text = dark ? "var(--doc-text)" : "var(--color-text)";
  const muted = dark ? "var(--doc-text-muted)" : "var(--color-text-muted)";
  const accent = dark ? "var(--doc-accent)" : "var(--color-accent)";

  if (!expanded) {
    return (
      <div
        className="flex items-center justify-between px-4 py-1.5"
        style={{
          backgroundColor: bg,
          borderBottom: `1px solid ${border}`,
        }}
      >
        <span className="text-xs font-medium" style={{ color: muted }}>
          Interactive Demo — 1M rows, all plugins
        </span>
        <button
          onClick={() => setExpanded(true)}
          className="p-0.5 rounded hover:opacity-80 cursor-pointer"
          style={{ color: muted }}
          aria-label="Expand banner"
        >
          <ChevronDown size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="px-4 py-3"
      style={{
        backgroundColor: bg,
        borderBottom: `1px solid ${border}`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2.5 min-w-0">
          <div>
            <h2 className="text-sm font-semibold leading-tight" style={{ color: text }}>
              Interactive Demo
            </h2>
            <p className="text-xs mt-0.5" style={{ color: muted }}>
              A trading dashboard built with Unify Table — 1M rows, all plugins active.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PILLS.map((pill) => (
              <span
                key={pill}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{
                  backgroundColor: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                  color: muted,
                  border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                }}
              >
                {pill}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: muted }}>
              Explore the code
            </span>
            {DOC_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-xs font-medium hover:underline"
                style={{ color: accent }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <button
          onClick={() => setExpanded(false)}
          className="p-0.5 rounded hover:opacity-80 cursor-pointer flex-shrink-0 mt-0.5"
          style={{ color: muted }}
          aria-label="Collapse banner"
        >
          <ChevronUp size={14} />
        </button>
      </div>
    </div>
  );
}

export default function Demo() {
  const { db } = useDB();
  const { dark } = useTheme();
  const tradesReady = useExampleData(db, TRADES_SQL);

  const ready = db && tradesReady;

  return (
    <div className="relative flex flex-col h-full" style={{ backgroundColor: dark ? "var(--doc-surface)" : "var(--color-surface)" }}>
      {/* Loading overlay — fades out when ready */}
      <div
        className="absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-300"
        style={{
          backgroundColor: dark ? "var(--doc-surface)" : "var(--color-surface)",
          opacity: ready ? 0 : 1,
          pointerEvents: ready ? "none" : "auto",
        }}
      >
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-10 h-10">
            <div
              className="absolute inset-0 border-2 rounded-full animate-spin"
              style={{
                borderColor: "transparent",
                borderTopColor: dark ? "var(--doc-accent)" : "var(--color-accent)",
              }}
            />
          </div>
          <p className="text-xs" style={{ color: dark ? "var(--doc-text-muted)" : "var(--color-text-muted)" }}>
            Generating 1M rows...
          </p>
        </div>
      </div>

      {/* Demo content */}
      {ready && (
        <DemoContext.Provider value={{ db, dark }}>
          <div className="flex-1 min-h-0">
            <DockLayout dark={dark} />
          </div>
        </DemoContext.Provider>
      )}
    </div>
  );
}
