import { PageTitle } from "../components/PageTitle";
import { Heading } from "../components/Heading";
import { CodeBlock } from "../components/CodeBlock";
import { Callout } from "../components/Callout";
import { PageNav } from "../components/PageNav";

function ArchitectureDiagram() {
  const layerBase: React.CSSProperties = {
    borderRadius: 8,
    padding: "16px 20px",
    border: "1px solid var(--doc-border)",
    position: "relative",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontFamily: "monospace",
    color: "var(--doc-text-muted)",
    marginBottom: 4,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--doc-text)",
    marginBottom: 4,
  };

  const descStyle: React.CSSProperties = {
    fontSize: 12,
    color: "var(--doc-text-secondary)",
    lineHeight: 1.5,
  };

  const arrowStyle: React.CSSProperties = {
    textAlign: "center",
    fontSize: 18,
    color: "var(--doc-text-muted)",
    padding: "4px 0",
    letterSpacing: 2,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, margin: "16px 0 24px" }}>
      {/* Charts Layer */}
      <div style={{ ...layerBase, background: "var(--doc-surface-alt)" }}>
        <div style={labelStyle}>@unify/table-charts</div>
        <div style={titleStyle}>Charts Layer</div>
        <div style={descStyle}>
          ECharts wrapper + SQL chart builders. Every chart is a SQL query — DuckDB aggregates, ECharts renders.
        </div>
      </div>
      <div style={arrowStyle}>|</div>

      {/* React Layer */}
      <div style={{ ...layerBase, background: "var(--doc-surface-alt)" }}>
        <div style={labelStyle}>@unify/table-react</div>
        <div style={titleStyle}>React Layer</div>
        <div style={descStyle}>
          Table component, 15 plugins, panels, displays, themes. Virtualizes rows via TanStack Virtual. Only renders the visible viewport.
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 10,
          }}
        >
          {["Plugins", "Panels", "Displays", "Themes", "Virtualization"].map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10,
                fontFamily: "monospace",
                padding: "2px 8px",
                borderRadius: 4,
                border: "1px solid var(--doc-border)",
                color: "var(--doc-accent)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div style={arrowStyle}>|</div>

      {/* Core Layer */}
      <div
        style={{
          ...layerBase,
          background: "var(--doc-surface-alt)",
          borderColor: "var(--doc-accent)",
          borderWidth: 1.5,
        }}
      >
        <div style={labelStyle}>@unify/table-core</div>
        <div style={titleStyle}>Core Layer</div>
        <div style={descStyle}>
          Zero dependencies. Pure TypeScript. SQL builder, query engine, data source, filter predicates. No React — can be used standalone.
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 10,
          }}
        >
          {["SQL Builder", "QueryEngine", "DataSource", "Filters", "Aggregations"].map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10,
                fontFamily: "monospace",
                padding: "2px 8px",
                borderRadius: 4,
                border: "1px solid var(--doc-border)",
                color: "var(--doc-accent)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div style={arrowStyle}>|</div>

      {/* DuckDB */}
      <div
        style={{
          ...layerBase,
          background: "var(--doc-surface-alt)",
          textAlign: "center",
        }}
      >
        <div style={{ ...titleStyle, marginBottom: 0 }}>DuckDB-WASM</div>
        <div style={{ ...descStyle, marginTop: 4 }}>
          Analytical SQL engine running in the browser via WebAssembly
        </div>
      </div>
    </div>
  );
}

function PipelineStep({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "1.5px solid var(--doc-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--doc-accent)",
          flexShrink: 0,
        }}
      >
        {number}
      </div>
      <div style={{ paddingTop: 3 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--doc-text)", marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--doc-text-secondary)", lineHeight: 1.5 }}>{description}</div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <div>
      <PageTitle>How It Works</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Understand the architecture that makes Unify Table different.
      </p>

      {/* The Core Idea */}
      <Heading level={2} id="the-core-idea">The Core Idea</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)", lineHeight: 1.7 }}>
        Most data table libraries do everything in JavaScript — sorting, filtering, grouping, aggregation.
        This works for small datasets but falls apart at scale. Unify Table takes a fundamentally different
        approach: <strong style={{ color: "var(--doc-text)" }}>DuckDB does the heavy lifting in SQL,
        React only renders what's visible.</strong>
      </p>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)", lineHeight: 1.7 }}>
        This isn't just a performance optimization — it's a different mental model. Your table is a SQL view.
        Sorting is <code>ORDER BY</code>. Filtering is <code>WHERE</code>. Grouping
        is <code>GROUP BY</code>. Aggregation is <code>SUM</code>/<code>AVG</code>/<code>COUNT</code>.
        All running in a real analytical database engine, in the browser, via WebAssembly.
      </p>
      <p className="text-[13px] mb-6" style={{ color: "var(--doc-text-secondary)", lineHeight: 1.7 }}>
        The result: you can sort a million rows in milliseconds, filter with complex predicates, group and
        aggregate across dozens of columns — all without shipping any of that data to a server or writing
        custom comparison functions in JavaScript.
      </p>

      {/* Architecture Layers */}
      <Heading level={2} id="architecture-layers">Architecture Layers</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)", lineHeight: 1.7 }}>
        The library is split into three layers, each with a clear responsibility. Dependencies only flow downward
        — the core layer has zero dependencies and can be used without React.
      </p>
      <ArchitectureDiagram />

      <Heading level={3} id="core-layer">Core Layer</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)", lineHeight: 1.7 }}>
        <code>@unify/table-core</code> is pure TypeScript with zero dependencies. It provides three key
        primitives: the <strong style={{ color: "var(--doc-text)" }}>SQL Builder</strong> for constructing
        queries with an immutable, chainable API; the <strong style={{ color: "var(--doc-text)" }}>QueryEngine</strong> for
        executing queries against any <code>TableConnection</code>; and
        the <strong style={{ color: "var(--doc-text)" }}>DataSource</strong> for managing reactive state
        (sort, filters, groupBy) with microtask-batched updates.
      </p>

      <Heading level={3} id="react-layer">React Layer</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)", lineHeight: 1.7 }}>
        <code>@unify/table-react</code> is the rendering layer. It virtualizes rows
        with TanStack Virtual so that a table with a million rows only renders the 30-50
        that are actually visible. Features are added through plugins — each one is an independent
        module with its own lifecycle.
      </p>

      <Heading level={3} id="charts-layer">Charts Layer</Heading>
      <p className="text-[13px] mb-6" style={{ color: "var(--doc-text-secondary)", lineHeight: 1.7 }}>
        <code>@unify/table-charts</code> wraps ECharts with SQL-driven chart builders. Every chart
        type — bar, line, pie, scatter, histogram, heatmap — starts as a SQL query. DuckDB aggregates the
        data into exactly the shape the chart needs, so you never ship raw data to the charting library.
      </p>

      {/* Plugin Composition */}
      <Heading level={2} id="plugin-composition">Plugin Composition, Not Prop Explosion</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)", lineHeight: 1.7 }}>
        Traditional table libraries give you a mega-component with hundreds of props. Want sorting?
        Add <code>sortable=&#123;true&#125;</code>. Want filtering? Add <code>filterable=&#123;true&#125;</code> plus
        a <code>filterModel</code> plus an <code>onFilterChange</code> callback. The props accumulate until
        the component signature is unreadable and every feature interacts with every other feature in
        unpredictable ways.
      </p>
      <p className="text-[13px] mb-4" style={{ color: "var(--doc-text-secondary)", lineHeight: 1.7 }}>
        Unify Table uses a plugin architecture instead. Each feature is an independent module:
      </p>

      <CodeBlock code={`// Traditional approach: prop explosion
<DataGrid
  sortable={true}
  filterable={true}
  editable={true}
  selectionMode="multi"
  onSelectionChange={handleSelection}
  filterModel={filters}
  onFilterChange={setFilters}
  resizable={true}
  groupBy={groupCols}
  onGroupChange={setGroupCols}
  // ... 50 more props
/>`} language="tsx" filename="Before" />

      <CodeBlock code={`// Unify Table: composable plugins
<Table
  db={db}
  table="trades"
  plugins={[
    filters(),
    selection('multi'),
    editing(),
    keyboard(),
    columnResize(),
    contextMenu(),
  ]}
/>`} language="tsx" filename="After" />

      <p className="text-[13px] mb-2 mt-4" style={{ color: "var(--doc-text-secondary)", lineHeight: 1.7 }}>
        This matters for several reasons:
      </p>
      <ul className="text-[13px] mb-6 space-y-2 pl-5" style={{ color: "var(--doc-text-secondary)", lineHeight: 1.7, listStyleType: "disc" }}>
        <li><strong style={{ color: "var(--doc-text)" }}>Bundle size</strong> — Only include what you use. A read-only table doesn't ship editing code.</li>
        <li><strong style={{ color: "var(--doc-text)" }}>No conflicts</strong> — Plugins declare their dependencies explicitly. If <code>clipboard()</code> needs <code>selection()</code>, it says so.</li>
        <li><strong style={{ color: "var(--doc-text)" }}>Custom plugins</strong> — You build plugins with the same API the built-in ones use. No second-class citizens.</li>
        <li><strong style={{ color: "var(--doc-text)" }}>Predictable lifecycle</strong> — Every plugin follows the same path: init, transform, render, cleanup. No surprises.</li>
      </ul>

      {/* The SQL Pipeline */}
      <Heading level={2} id="sql-pipeline">The SQL Pipeline</Heading>
      <p className="text-[13px] mb-4" style={{ color: "var(--doc-text-secondary)", lineHeight: 1.7 }}>
        Here's what happens when a user clicks a column header to sort:
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
        <PipelineStep
          number={1}
          title="User clicks a column header"
          description="The click handler calls dataSource.setSort() with the column name and direction."
        />
        <PipelineStep
          number={2}
          title="DataSource updates its sort state"
          description="The DataSource stores the new sort configuration and queues a microtask to batch any additional state changes that happen in the same tick."
        />
        <PipelineStep
          number={3}
          title="SQL builder constructs a new query"
          description="The immutable SQL builder chains the current filters, groupBy, and the new ORDER BY clause into a complete SELECT statement."
        />
        <PipelineStep
          number={4}
          title="DuckDB executes the query"
          description="The query runs in DuckDB-WASM — a full analytical engine compiled to WebAssembly. Sorting a million rows takes milliseconds, not seconds."
        />
        <PipelineStep
          number={5}
          title="React re-renders the visible viewport"
          description="TanStack Virtual determines which rows are visible in the scroll container. Only those rows are rendered — typically 30 to 50 DOM nodes regardless of dataset size."
        />
      </div>

      <p className="text-[13px] mb-6" style={{ color: "var(--doc-text-secondary)", lineHeight: 1.7 }}>
        Every interaction follows this same pattern: user action, state change, SQL generation, DuckDB execution,
        viewport render. Filtering adds a <code>WHERE</code> clause. Grouping adds <code>GROUP BY</code>.
        Aggregation adds <code>SUM()</code>/<code>AVG()</code>. The JavaScript layer never touches your data
        directly — it only describes what it wants via SQL.
      </p>

      {/* Zero-Config to Full Control */}
      <Heading level={2} id="zero-config">Zero-Config to Full Control</Heading>
      <p className="text-[13px] mb-4" style={{ color: "var(--doc-text-secondary)", lineHeight: 1.7 }}>
        Unify Table is designed for progressive complexity. Start simple, add sophistication only when you need it.
      </p>

      <Heading level={3} id="zero-config-default">Zero config</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)", lineHeight: 1.7 }}>
        Two props. Auto-detects columns from the DuckDB table schema. Renders everything with sensible defaults.
      </p>
      <CodeBlock code={`<Table db={db} table="trades" />`} language="tsx" />

      <Heading level={3} id="add-features">Add features</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)", lineHeight: 1.7 }}>
        Opt into specific capabilities by adding plugins. Each one is independent — mix and match freely.
      </p>
      <CodeBlock code={`<Table
  db={db}
  table="trades"
  plugins={[filters(), selection('multi'), columnResize()]}
/>`} language="tsx" />

      <Heading level={3} id="use-presets">Use presets</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)", lineHeight: 1.7 }}>
        Presets are curated plugin bundles for common use cases. One function call instead of a dozen.
      </p>
      <CodeBlock code={`// Full spreadsheet: editing, clipboard, keyboard, selection, context menu, ...
plugins={spreadsheet()}

// Analytics view: filters, grouping, column resize, formatting, ...
plugins={dataViewer()}

// Minimal read-only: filters, column resize, formatting
plugins={readOnly()}`} language="tsx" />

      <Heading level={3} id="go-headless">Go headless</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)", lineHeight: 1.7 }}>
        Need full control? Use the headless hook to get the complete <code>TableContext</code> and render
        everything yourself.
      </p>
      <CodeBlock code={`const ctx = useTableContext({ db, table: "trades", plugins: [...] });

// You get: rows, columns, sort state, filter state, selection,
// and every method to manipulate them. Render however you want.`} language="tsx" />

      <Callout type="tip" title="Ready to build?">
        Start with the <a href="#/getting-started">Getting Started</a> guide to set up your first table,
        or jump straight to the <a href="#/demo">Demo</a> to see everything in action.
      </Callout>
      <PageNav />
    </div>
  );
}
