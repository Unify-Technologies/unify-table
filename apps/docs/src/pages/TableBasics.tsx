import { PageTitle } from "../components/PageTitle";
import { Heading } from "../components/Heading";
import { Example } from "../components/Example";
import { PropTable } from "../components/PropTable";
import { CodeBlock } from "../components/CodeBlock";
import { Callout } from "../components/Callout";
import { PageNav } from "../components/PageNav";

export default function TableBasics() {
  return (
    <div>
      <PageTitle>Table Basics</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        The Table component renders a virtualized data table backed by DuckDB.
      </p>

      <p className="text-[13px] mb-6" style={{ color: "var(--doc-text-secondary)" }}>
        The <code>Table</code> component is the main entry point for Unify Table. It takes a DuckDB
        connection and a table name, queries the schema, and renders a virtualized grid. Everything
        else is optional — columns are auto-detected, plugins add features incrementally, and
        themes are applied through CSS. A single <code>&lt;Table db=&#123;db&#125; table="trades" /&gt;</code> call
        is all you need to get a working table.
      </p>

      <Heading level={2} id="minimal">Minimal Example</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        With just <code>db</code> and <code>table</code>, columns are auto-detected from the DuckDB schema. Here's 10,000 trades rendered with zero configuration:
      </p>
      <Example id="basic-table" height={350} />

      <Heading level={2} id="with-plugins">Adding Plugins</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The minimal table above is static. Add the <code>filters()</code> plugin to let users narrow
        down the data — notice the filter row that appears below the headers:
      </p>
      <Example id="with-filters" title="With Filters" description="Same trades data, now filterable. Pre-filtered to profitable AAPL trades. Try changing the filter values." height={350} />

      <Heading level={2} id="props">Table Props</Heading>
      <PropTable
        title="TableProps"
        rows={[
          { name: "db", type: "TableConnection", description: "DuckDB connection instance", required: true },
          { name: "table", type: "string", description: "Name of the DuckDB table to query", required: true },
          { name: "columns", type: "(ColumnDef | string)[]", description: "Column definitions. If omitted, columns are auto-detected from schema." },
          { name: "plugins", type: "TablePlugin[]", description: "Array of plugin instances to compose features" },
          { name: "styles", type: "TableStyles", description: "CSS class names for table slots (header, row, cell, etc.)" },
          { name: "density", type: "'compact' | 'comfortable' | 'spacious'", default: "'comfortable'", description: "Row height: 28px / 36px / 48px" },
          { name: "height", type: "number | string", description: "Table container height (px or CSS string)" },
          { name: "displays", type: "DisplayConfig[]", description: "Display configurations (charts, stats, etc.)" },
          { name: "panels", type: "false | PanelConfig[]", description: "Panel configurations, or false to disable panels entirely" },
          { name: "panelPosition", type: "'left' | 'right'", default: "'right'", description: "Which side panels open on" },
          { name: "initialSort", type: "SortField[]", description: "Initial sort state" },
          { name: "initialGroupBy", type: "string[]", description: "Initial grouping columns" },
          { name: "initialFilterValues", type: "Record<string, string>", description: "Initial filter input values" },
          { name: "initialHiddenCols", type: "string[]", description: "Columns to hide on first render" },
          { name: "initialColumnOrder", type: "string[]", description: "Initial column display order" },
          { name: "initialColumnWidths", type: "Record<string, number>", description: "Initial column widths in pixels" },
          { name: "onSortChange", type: "(sort: SortField[]) => void", description: "Callback when sort state changes" },
          { name: "onFilterValuesChange", type: "(values: Record<string, string>) => void", description: "Callback when filter values change" },
          { name: "onGroupByChange", type: "(cols: string[]) => void", description: "Callback when group-by columns change" },
        ]}
      />

      <Heading level={2} id="under-the-hood">How It Works Under the Hood</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        When you render a <code>Table</code>, three layers work together:
      </p>
      <ul className="text-[13px] mb-4 list-disc pl-5 space-y-2" style={{ color: "var(--doc-text-secondary)" }}>
        <li>
          <strong style={{ color: "var(--doc-text)" }}>DataSource</strong> — a reactive state manager that
          owns sort, filter, and groupBy state. When any state changes, it emits events and batches
          re-queries via <code>queueMicrotask</code> to avoid redundant work.
        </li>
        <li>
          <strong style={{ color: "var(--doc-text)" }}>QueryEngine</strong> — a thin wrapper around the
          DuckDB connection. It translates the DataSource state into SQL, executes queries, and
          returns results. All sorting, filtering, grouping, and aggregation happens in SQL — JavaScript
          never touches the full dataset.
        </li>
        <li>
          <strong style={{ color: "var(--doc-text)" }}>TanStack Virtual</strong> — handles row
          virtualization. Only the rows visible in the viewport are rendered to the DOM, so scrolling
          through millions of rows is as fast as scrolling through a hundred.
        </li>
      </ul>

      <Heading level={2} id="table-vs-hook">Table vs useTableContext</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The <code>Table</code> component is the standard way to render a table — it handles layout,
        virtualization, headers, and plugin rendering out of the box. For cases where you need full
        control over the rendered output, use the <code>useTableContext</code> hook instead. It returns
        the complete <code>TableContext</code> (data, state, actions) without rendering anything, so you
        can build a fully custom UI while still benefiting from the query engine and plugin system.
      </p>
      <Callout type="tip" title="When to choose which">
        Use <code>Table</code> when the built-in layout works for your use case. Reach
        for <code>useTableContext</code> when you need a non-standard layout, want to embed table
        data in a custom component, or need to coordinate multiple tables sharing the same data source.
      </Callout>

      <PageNav />
    </div>
  );
}
