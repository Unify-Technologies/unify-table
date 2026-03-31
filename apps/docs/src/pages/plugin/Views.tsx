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
      <CodeBlock code={`// Save current view state
ctx.views.save('Q1 Summary');

// List saved views
const list = ctx.views.list();

// Apply a saved view
ctx.views.apply('Q1 Summary');

// Delete a saved view
ctx.views.remove('Q1 Summary');`} language="tsx" />

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
