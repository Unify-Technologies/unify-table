import { PageTitle } from "../components/PageTitle";
import { Heading } from "../components/Heading";
import { CodeBlock } from "../components/CodeBlock";
import { Callout } from "../components/Callout";
import { Example } from "../components/Example";
import { PageNav } from "../components/PageNav";
import { Link } from "../router";

export default function GettingStarted() {
  return (
    <div>
      <PageTitle>Getting Started</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Build your first DuckDB-powered data table in under 5 minutes.
      </p>

      {/* ── Prerequisites ── */}
      <Heading level={2} id="prerequisites">Prerequisites</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Before you start, make sure you have:
      </p>
      <ul className="text-[13px] mb-4 list-disc pl-5 space-y-1" style={{ color: "var(--doc-text-secondary)" }}>
        <li><strong style={{ color: "var(--doc-text)" }}>React 19+</strong> as your UI framework</li>
        <li>
          <strong style={{ color: "var(--doc-text)" }}>A DuckDB-WASM connection</strong> that
          implements the <code>TableConnection</code> interface — see
          the <Link to="/query-engine" style={{ color: "var(--doc-accent)" }}>Query Engine</Link> page
          for setup details
        </li>
        <li>
          <strong style={{ color: "var(--doc-text)" }}>pnpm, npm, or yarn</strong> as your package manager
        </li>
      </ul>

      {/* ── Installation ── */}
      <Heading level={2} id="installation">Installation</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The library is split into three packages: <strong style={{ color: "var(--doc-text)" }}>core</strong> (SQL
        engine and data source), <strong style={{ color: "var(--doc-text)" }}>react</strong> (components and
        plugins), and <strong style={{ color: "var(--doc-text)" }}>charts</strong> (ECharts-based
        visualizations). Install all three:
      </p>
      <CodeBlock code={`pnpm add @unify/table-core @unify/table-react @unify/table-charts`} language="bash" filename="Terminal" />

      {/* ── CSS Imports ── */}
      <Heading level={2} id="css-imports">CSS Imports</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Unify Table ships its own CSS rather than relying on Tailwind. Add these three imports to your
        app entry point. They cover panel layouts, theme class definitions, and display renderer styles
        (charts, stats, pivots).
      </p>
      <CodeBlock code={`import '@unify/table-react/styles';    // Panel layouts + base component CSS
import '@unify/table-react/themes';    // Dark & light theme class definitions
import '@unify/table-react/displays';  // Display renderer CSS (charts, stats, pivots)`} language="tsx" filename="main.tsx" />

      {/* ── Your First Table ── */}
      <Heading level={2} id="first-table">Your First Table</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The simplest possible table requires just two props — a DuckDB connection and a table name:
      </p>
      <CodeBlock code={`<Table db={db} table="trades" />`} language="tsx" />
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        That's it. The Table component auto-detects columns from DuckDB, virtualizes rows for
        performance, and handles scrolling. No column definitions needed — DuckDB's schema IS the
        source of truth. Here it is running live:
      </p>
      <Example id="basic-table" title="Zero-Config Table" description="Two props, 10,000 rows. Columns auto-detected from DuckDB. Scroll to see virtual rendering." height={350} />
      <Callout type="tip" title="Column auto-detection">
        When you omit the <code>columns</code> prop, the table queries DuckDB
        for <code>DESCRIBE</code> metadata and builds column definitions automatically. You can
        always pass explicit <code>columns</code> for fine-grained control over labels,
        widths, formatting, and sort behavior.
      </Callout>

      {/* ── Adding Interactivity ── */}
      <Heading level={2} id="adding-plugins">Adding Interactivity</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Features are plugins, not props. This keeps the API composable and the bundle lean — you only
        pay for what you use. Pass an array of plugin functions to the <code>plugins</code> prop:
      </p>
      <CodeBlock code={`import { Table, filters, selection, columnResize, darkTheme } from '@unify/table-react';

<Table
  db={db}
  table="trades"
  plugins={[filters(), selection('multi'), columnResize()]}
  styles={darkTheme.styles}
  height={500}
/>`} language="tsx" />
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Here's what each plugin in the example above does:
      </p>
      <ul className="text-[13px] mb-4 list-disc pl-5 space-y-1" style={{ color: "var(--doc-text-secondary)" }}>
        <li>
          <strong style={{ color: "var(--doc-text)" }}>filters()</strong> — adds column-level filter
          dropdowns with composable predicates (equals, contains, greater than, etc.)
        </li>
        <li>
          <strong style={{ color: "var(--doc-text)" }}>selection('multi')</strong> — enables cell
          selection with single-click, Shift+click range, and Ctrl+click multi-select
        </li>
        <li>
          <strong style={{ color: "var(--doc-text)" }}>columnResize()</strong> — adds drag handles on
          column borders for adjusting widths
        </li>
      </ul>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        There are 15 plugins in total, covering everything from inline editing and clipboard support
        to row grouping and context menus. See
        the <Link to="/plugins" style={{ color: "var(--doc-accent)" }}>Plugins</Link> page for the
        full list.
      </p>

      {/* ── Using Presets ── */}
      <Heading level={2} id="presets">Using Presets</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Presets are curated plugin bundles for common use cases. Use them as starting points, or
        spread them and override individual plugins.
      </p>
      <CodeBlock code={`import { spreadsheet, dataViewer, readOnly } from '@unify/table-react';

// Full spreadsheet — editing, clipboard, keyboard nav, context menus
plugins={spreadsheet()}

// Analytics viewer — filters, grouping, sorting, column resize
plugins={dataViewer()}

// Minimal — filters, column resize, and formatting only
plugins={readOnly()}`} language="tsx" />
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Since presets return a plain array of plugins, you can compose on top of them:
      </p>
      <CodeBlock code={`// Start with dataViewer, add context menus
plugins={[...dataViewer(), contextMenu()]}`} language="tsx" />

      {/* ── Choosing a Theme ── */}
      <Heading level={2} id="themes">Choosing a Theme</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Unify Table ships with two built-in themes. Each theme object
        provides <code>styles</code> (CSS class names for the table), <code>panelVars</code> (CSS
        variable overrides for panels), and <code>containerClass</code> (a wrapper class for
        scoping). Apply them like this:
      </p>
      <CodeBlock code={`import { Table, darkTheme, lightTheme } from '@unify/table-react';

const theme = darkTheme; // or lightTheme

<div className={theme.containerClass} style={{ ...theme.panelVars }}>
  <Table
    db={db}
    table="trades"
    styles={theme.styles}
    height={500}
  />
</div>`} language="tsx" />
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The <code>containerClass</code> and <code>panelVars</code> are only needed if you use panels
        (filter panel, column panel, etc.). For a standalone table, <code>styles</code> alone is
        enough. See the <Link to="/themes" style={{ color: "var(--doc-accent)" }}>Themes</Link> page
        for customization details.
      </p>

      {/* ── Next Steps ── */}
      <Heading level={2} id="next-steps">Next Steps</Heading>
      <div
        className="rounded-lg p-5 my-4 space-y-3"
        style={{
          backgroundColor: "var(--doc-surface-alt)",
          border: "1px solid var(--doc-border)",
        }}
      >
        <p className="text-[13px] font-semibold" style={{ color: "var(--doc-text)" }}>
          Now that you have a table running, here's where to go next:
        </p>
        <ul className="text-[13px] space-y-2" style={{ color: "var(--doc-text-secondary)" }}>
          <li>
            <Link to="/how-it-works" style={{ color: "var(--doc-accent)", fontWeight: 500 }}>How It Works</Link>
            {" "} — understand the architecture: how DuckDB handles sorting, filtering, and
            grouping in SQL so JavaScript only renders the visible viewport
          </li>
          <li>
            <Link to="/plugins" style={{ color: "var(--doc-accent)", fontWeight: 500 }}>Plugins</Link>
            {" "} — explore all 15 plugins with live examples and API reference
          </li>
          <li>
            <Link to="/demo" style={{ color: "var(--doc-accent)", fontWeight: 500 }}>Demo</Link>
            {" "} — see a full application with multiple tables, tabs, and all features working together
          </li>
        </ul>
      </div>

      <PageNav />
    </div>
  );
}
