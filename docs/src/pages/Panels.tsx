import { PageTitle } from "../components/PageTitle";
import { Heading } from "../components/Heading";
import { CodeBlock } from "../components/CodeBlock";
import { Example } from "../components/Example";
import { Callout } from "../components/Callout";
import { PageNav } from "../components/PageNav";

export default function Panels() {
  return (
    <div>
      <PageTitle>Panels</PageTitle>
      <p className="text-[15px] mb-4" style={{ color: "var(--doc-text-secondary)" }}>
        Side panels provide UI for filtering, grouping, column management, and more.
      </p>
      <p className="text-[13px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Panels are slide-out UI components that provide configuration interfaces — filter builder, column manager, group-by picker, and more. Click the icons in the toolbar to open each panel. Only one panel is open at a time.
      </p>

      <Example
        id="with-panels"
        title="Built-in Panels"
        description="Click the toolbar icons on the right to open panels — Filters, Group By, Columns, Export, Displays, and Debug. Each panel controls a different aspect of the table."
        height={460}
      />

      <Heading level={2} id="built-in">Built-in Panels</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Six panels ship with the table, each tied to a specific plugin or feature:
      </p>
      <div className="text-[13px] mb-6 space-y-1" style={{ color: "var(--doc-text-secondary)" }}>
        <p><strong>Filters</strong> — visual filter builder with per-column predicates and combinators. Requires the <code>filters</code> plugin.</p>
        <p><strong>Group By</strong> — drag-and-drop column grouping with aggregation configuration. Requires the <code>rowGrouping</code> plugin.</p>
        <p><strong>Columns</strong> — show, hide, reorder, and pin columns. Works with the <code>columnReorder</code> and <code>columnPin</code> plugins.</p>
        <p><strong>Export</strong> — export table data to CSV, JSON, or Parquet. Requires the <code>tableIO</code> plugin.</p>
        <p><strong>Displays</strong> — switch between display modes (chart, stats, pivot, etc.) and configure display options.</p>
        <p><strong>Debug</strong> — inspect the current SQL query, state, and performance metrics during development.</p>
      </div>

      <Heading level={2} id="config">Panel Configuration</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Panels are enabled by default. You can disable them entirely or change their position relative to the table.
      </p>
      <CodeBlock code={`// Disable panels entirely
<Table panels={false} />

// Panel position
<Table panelPosition="left" />  // or "right" (default)`} language="tsx" />

      <Heading level={2} id="custom">Custom Panels</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Register your own panels alongside the built-in ones. Each descriptor specifies a key, label, optional icon, and a render function that receives the full <code>TableContext</code>.
      </p>
      <CodeBlock code={`interface PanelDescriptor {
  key: string;
  label: string;
  icon?: React.ComponentType<{ size?: number }>;
  render: (ctx: TableContext) => ReactNode;
}`} language="tsx" />
      <Callout type="tip" title="Panel + Plugin Pattern">
        Custom panels work best when paired with a custom plugin. The plugin manages state and logic, while the panel provides the UI. This keeps your panel component thin and testable.
      </Callout>
      <PageNav />
    </div>
  );
}
