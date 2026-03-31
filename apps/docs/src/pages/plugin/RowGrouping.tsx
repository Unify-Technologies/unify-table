import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { Example } from "../../components/Example";
import { CodeBlock } from "../../components/CodeBlock";
import { Callout } from "../../components/Callout";
import { PageNav } from "../../components/PageNav";

export default function RowGroupingPlugin() {
  return (
    <div>
      <PageTitle>Row Grouping</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Group rows by one or more columns with expand/collapse and aggregation support.
      </p>

      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Row grouping lets users collapse rows into hierarchical groups by one or more columns.
        Combined with aggregations, it transforms a flat table into a pivot-like view — all powered
        by GROUP BY queries in DuckDB. This means grouping and aggregation run at database speed,
        not in JavaScript, so the experience stays snappy even on large datasets.
      </p>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Group by a single column to see totals per category, or nest multiple columns for a
        drilldown hierarchy (e.g. region, then product, then quarter). Each group header row
        shows the aggregated values and can be expanded to reveal the underlying rows.
      </p>

      <Callout type="info">See row grouping in action in the <a href="#/demo" style={{color: "var(--doc-accent)"}}>Interactive Demo</a> — the "Trades" panel groups by region with PnL aggregations.</Callout>

      <Heading level={2} id="usage">Usage</Heading>
      <CodeBlock code={`import { Table, rowGrouping } from '@unify/table-react';

<Table db={db} table="sales" plugins={[rowGrouping()]} />`} language="tsx" />

      <Heading level={2} id="example">Example</Heading>
      <Example id="with-grouping" description="Grouped by Desk then Ticker. Click expand arrows to drill into groups. Try adding a filter on Region while grouped." height={350} />

      <Heading level={2} id="aggregations">Aggregations</Heading>
      <CodeBlock code={`// Grouping is driven by DataSource state
ctx.dataSource.setGroupBy(['region', 'product']);

// Aggregations are configured per column
ctx.dataSource.setAggregations({
  revenue: 'sum',
  quantity: 'avg',
  orders: 'count',
});`} language="tsx" />

      <Heading level={2} id="expand-collapse">Expand / Collapse</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Group header rows show aggregated values and can be expanded or collapsed.
        All grouping and aggregation happens in SQL via DuckDB GROUP BY, so performance
        scales to millions of rows.
      </p>
      <Callout type="info" title="Available aggregations">
        Built-in aggregation functions include <code>sum</code>, <code>avg</code>, <code>count</code>,{" "}
        <code>min</code>, <code>max</code>, <code>count_distinct</code>, <code>median</code>,{" "}
        <code>first</code>, <code>last</code>, <code>mode</code>, <code>stddev</code>,{" "}
        <code>variance</code>, and <code>string_agg</code>. You can also register custom aggregations
        via <code>registerAgg()</code>.
      </Callout>
      <PageNav />
    </div>
  );
}
