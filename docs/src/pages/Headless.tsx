import { PageTitle } from "../components/PageTitle";
import { Heading } from "../components/Heading";
import { CodeBlock } from "../components/CodeBlock";
import { Callout } from "../components/Callout";
import { PageNav } from "../components/PageNav";

export default function Headless() {
  return (
    <div>
      <PageTitle>Headless Mode</PageTitle>
      <p className="text-[15px] mb-4" style={{ color: "var(--doc-text-secondary)" }}>
        Use <code>useTableContext</code> for full control over rendering.
      </p>
      <p className="text-[13px] mb-4" style={{ color: "var(--doc-text-secondary)" }}>
        Everything shown in the previous pages — filters, selection, editing, grouping, displays — works
        through the <code>TableContext</code> object. The <code>&lt;Table&gt;</code> component renders
        that context with a built-in UI. The headless API gives you the same context without the UI,
        so you can render however you want.
      </p>
      <p className="text-[13px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        You get the same DuckDB-powered data pipeline, the same plugin system, and the same reactive
        state management — just without the built-in table markup and styling.
      </p>

      <Heading level={2} id="when">When to Go Headless</Heading>
      <div className="text-[13px] mb-6 space-y-1" style={{ color: "var(--doc-text-secondary)" }}>
        <p><strong>Custom table UI</strong> — when you need a completely different table layout, custom row components, or design system integration that the built-in table can't accommodate.</p>
        <p><strong>Non-table visualizations</strong> — dashboards, cards, or other views that consume the same filtered/sorted/grouped data pipeline but don't render as a table.</p>
        <p><strong>Hybrid layouts</strong> — combine table data with other components (maps, charts, detail panels) that all react to the same filter and sort state.</p>
        <p><strong>Testing</strong> — write unit tests against the context API without rendering the full table component.</p>
      </div>

      <Heading level={2} id="hook">useTableContext</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Call the hook with the same options you'd pass to <code>&lt;Table&gt;</code> — a database connection, table name, column definitions, and plugins. It returns a <code>TableContext</code> object with all data and mutation methods.
      </p>
      <CodeBlock code={`import { useTableContext } from '@unify/table-react';

function CustomTable() {
  const ctx = useTableContext({ db, table: 'employees', plugins: [filters()] });

  return (
    <div>
      <p>Total: {ctx.totalCount} rows</p>
      <p>Sort: {JSON.stringify(ctx.sort)}</p>
      <table>
        <thead>
          <tr>
            {ctx.columns.map(col => <th key={col.field}>{col.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {ctx.rows.map((row, i) => (
            <tr key={i}>
              {ctx.columns.map(col => <td key={col.field}>{String(row[col.field])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}`} language="tsx" />

      <Heading level={2} id="context-api">Context API</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The <code>TableContext</code> object exposes both read-only state and mutation methods. State properties are reactive — they update automatically when the underlying data or configuration changes.
      </p>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        <strong>State:</strong> <code>columns</code>, <code>rows</code>, <code>sort</code>, <code>filters</code>, <code>groupBy</code>, <code>totalCount</code>, <code>isLoading</code>, <code>selection</code>.
      </p>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        <strong>Mutations:</strong> <code>setSort()</code>, <code>setFilters()</code>, and more. Editing methods like <code>startEditing()</code> and <code>commitEdit()</code> are available via <code>ctx.editing</code> when the editing plugin is active.
      </p>
      <Callout type="info" title="Plugins Still Work">
        All plugins (selection, editing, keyboard, clipboard, etc.) work in headless mode. They extend the context with additional state and methods. The only difference is that you're responsible for rendering the UI that uses them.
      </Callout>
      <PageNav />
    </div>
  );
}
