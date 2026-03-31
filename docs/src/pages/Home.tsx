import { Link } from "../router";
import { useTheme } from "../providers/ThemeProvider";
import { Example } from "../components/Example";
import { ExampleRunner } from "../components/ExampleRunner";
import { EXAMPLES } from "../examples";
import { CodeBlock } from "../components/CodeBlock";
import { Database, Puzzle, BarChart3, Code2, ArrowRight, Zap, Layers, Table2 } from "lucide-react";

const FEATURES = [
  { icon: Database, title: "DuckDB-Powered", desc: "Sort, filter, group, aggregate — all in SQL. Handles millions of rows natively in the browser.", color: "#3b82f6" },
  { icon: Puzzle, title: "Plugin Composition", desc: "16 plugins, mix and match. Not a mega-component with 200 props. Start minimal, add what you need.", color: "#8b5cf6" },
  { icon: BarChart3, title: "7 Display Types", desc: "Charts, stats, pivot, summary, correlation, timeline, and outlier detection. All driven by SQL.", color: "#10b981" },
  { icon: Code2, title: "Type-Safe SQL", desc: "Immutable, chainable query builder with composable filter predicates. No raw string concatenation.", color: "#f59e0b" },
];

const QUICK_CODE = `import { Table, spreadsheet } from '@unify/table-react';
import '@unify/table-react/styles';
import '@unify/table-react/themes';

<Table
  db={db}
  table="trades"
  plugins={spreadsheet()}
  height={600}
/>`;

const STATS = [
  { label: "Plugins", value: "16", icon: Puzzle },
  { label: "Display Types", value: "7", icon: Layers },
  { label: "Chart Types", value: "10", icon: BarChart3 },
  { label: "Max Rows", value: "1M+", icon: Zap },
];

export default function Home() {
  const { dark } = useTheme();
  const text = dark ? "var(--doc-text)" : "var(--color-text)";
  const textSecondary = dark ? "var(--doc-text-secondary)" : "var(--color-text-secondary)";
  const textMuted = dark ? "var(--doc-text-muted)" : "var(--color-text-muted)";
  const accent = dark ? "var(--doc-accent)" : "var(--color-accent)";
  const border = dark ? "var(--doc-border)" : "var(--color-border)";
  const cardBg = dark ? "var(--doc-surface-alt)" : "var(--color-surface-alt)";

  return (
    <div>
      {/* Hero */}
      <div className="doc-hero-gradient text-center pt-16 pb-16 -mx-6 lg:-mx-12 px-6 mb-8 -mt-8">
        {/* Glowing badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium mb-6 doc-hero-badge"
          style={{
            backgroundColor: dark ? "rgba(59,130,246,0.12)" : "rgba(38,139,210,0.08)",
            color: accent,
            border: `1px solid ${dark ? "rgba(59,130,246,0.25)" : "rgba(38,139,210,0.2)"}`,
          }}
        >
          <Table2 size={12} />
          Powered by DuckDB-WASM
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold mb-5 tracking-tight leading-[1.15]" style={{ color: text }}>
          DuckDB-Native Data<br />Tables & Charts
        </h1>
        <p className="text-base sm:text-lg max-w-2xl mx-auto mb-4 leading-relaxed" style={{ color: textSecondary }}>
          SQL does the work. React renders the viewport.
        </p>
        <p className="text-sm max-w-xl mx-auto mb-8" style={{ color: textMuted }}>
          Sort, filter, group, and aggregate millions of rows — all in DuckDB-WASM.<br className="hidden sm:inline" />
          16 composable plugins. 7 display types. Zero-config to fully headless.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/getting-started"
            className="group inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white no-underline transition-all"
            style={{ backgroundColor: accent, minWidth: 160 }}
          >
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            Get Started
          </Link>
          <Link
            to="/demo"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium no-underline transition-colors"
            style={{ border: `1px solid ${border}`, color: textSecondary, minWidth: 160 }}
          >
            <Zap size={14} />
            View Demo
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-lg px-4 py-3"
            style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
          >
            <s.icon size={16} style={{ color: accent, flexShrink: 0 }} />
            <div>
              <div className="text-lg font-bold" style={{ color: text }}>{s.value}</div>
              <div className="text-[11px]" style={{ color: textMuted }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Example */}
      <Example id="preset-spreadsheet" title="Try it — fully interactive" description="Click cells to edit, drag column borders to resize, right-click for context menu, Shift+Click to select ranges." height={400} />

      {/* Features */}
      <h2 className="text-xl font-semibold mt-14 mb-5" style={{ color: text }}>Why Unify Table?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="doc-feature-card rounded-xl p-5"
            style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: `${f.color}15`, color: f.color }}
            >
              <f.icon size={16} />
            </div>
            <h3 className="text-sm font-semibold mb-1.5" style={{ color: text }}>{f.title}</h3>
            <p className="text-[13px] leading-relaxed" style={{ color: textSecondary }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Quick Start */}
      <h2 className="text-xl font-semibold mt-14 mb-4" style={{ color: text }}>Quick Start</h2>
      <CodeBlock code={QUICK_CODE} language="tsx" filename="App.tsx" />

      {/* Explore section */}
      <h2 className="text-xl font-semibold mt-14 mb-5" style={{ color: text }}>Explore</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16" style={{ gridTemplateRows: "1fr auto" }}>
        {[
          { label: "10K Trades, One Line", id: "basic-table", desc: "Zero config. Auto-detected columns. Virtual scrolling at 60fps.", path: "/table-basics" },
          { label: "Instant Analytics", id: "preset-data-viewer", desc: "Charts, pivots, timelines — all powered by DuckDB SQL.", path: "/displays" },
          { label: "Full Spreadsheet", id: "preset-spreadsheet", desc: "Edit, filter, copy/paste, group — one import, one function call.", path: "/presets" },
        ].map((item) => {
          const ex = EXAMPLES[item.id];
          return (
            <Link
              key={item.id}
              to={item.path}
              className="rounded-xl overflow-hidden no-underline doc-feature-card"
              style={{ border: `1px solid ${border}`, display: "grid", gridTemplateRows: "subgrid", gridRow: "span 2" }}
            >
              <div style={{ pointerEvents: "none", overflow: "hidden" }}>
                {ex && <ExampleRunner component={ex.component} seedSql={ex.seedSql} height={220} />}
              </div>
              <div className="px-4 py-3 flex items-start justify-between" style={{ borderTop: `1px solid ${border}`, backgroundColor: cardBg }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: text }}>{item.label}</p>
                  <p className="text-[12px]" style={{ color: textSecondary }}>{item.desc}</p>
                </div>
                <ArrowRight size={14} style={{ color: textMuted, flexShrink: 0, marginTop: 4 }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
