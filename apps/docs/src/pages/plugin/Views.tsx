import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { CodeBlock } from "../../components/CodeBlock";
import { Callout } from "../../components/Callout";
import { PageNav } from "../../components/PageNav";

export default function ViewsPlugin() {
  return (
    <div>
      <PageTitle>Views</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Save and restore view presets that capture filters, sort order, and groupBy configuration.
      </p>

      <Heading level={2} id="usage">Usage</Heading>
      <CodeBlock code={`import { Table, views } from '@unify/table-react';

<Table db={db} table="sales" plugins={[views()]} />`} language="tsx" />

      <Heading level={2} id="api">API</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Views are managed through standalone functions that operate on the table context:
      </p>
      <CodeBlock code={`import { views, saveView, applyView, listViews, serializeViews } from '@unify/table-react';

// Save current state as a named view
saveView('Q1 Summary', ctx);

// List saved view names
const names = listViews(); // ['Q1 Summary', ...]

// Restore a saved view
applyView('Q1 Summary', ctx);

// Serialize all views to JSON (for persistence)
const json = serializeViews();`} language="tsx" />

      <Heading level={2} id="what-is-saved">What Gets Saved</Heading>
      <div className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        <p className="mb-2">A view preset captures:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Filters</strong> — all active column filters and their values</li>
          <li><strong>Sort</strong> — sort columns and directions</li>
          <li><strong>Group By</strong> — grouped columns and aggregation functions</li>
          <li><strong>Column visibility</strong> — which columns are shown or hidden</li>
          <li><strong>Column order</strong> — the current arrangement of columns</li>
        </ul>
      </div>

      <Callout type="tip" title="Use case: team dashboards">
        Create views for common analysis patterns — "Q1 Revenue by Region", "Top Performers", "Overdue Items" — so team members
        can switch between them instantly without rebuilding filters and sorts each time.
      </Callout>
      <PageNav />
    </div>
  );
}
