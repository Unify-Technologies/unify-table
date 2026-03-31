import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { Example } from "../../components/Example";
import { CodeBlock } from "../../components/CodeBlock";
import { Callout } from "../../components/Callout";
import { PageNav } from "../../components/PageNav";

export default function StatsDisplay() {
  return (
    <div>
      <PageTitle>Stats Display</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Summary statistic cards with aggregations per column. Compact notation (K/M/B/T) for large numbers.
      </p>
      <p className="text-[13px] mb-6" style={{ color: "var(--doc-text-secondary)" }}>
        The stats display renders summary cards — one per aggregation — with compact number notation (K/M/B/T).
        Ideal for dashboards where you need quick KPIs at a glance. Each card runs a single SQL aggregation
        against the current (potentially filtered) data, so the numbers always reflect what the user sees.
      </p>

      <Callout type="info">See stats in action in the <a href="#/demo" style={{color: "var(--doc-accent)"}}>Interactive Demo</a> — the "Stats" panel shows aggregated trade metrics.</Callout>

      <Heading level={2} id="example">Stats Cards</Heading>
      <Example id="display-stats" title="Trade KPIs" description="Instant aggregations across 10K trades. Filter the table — stats update to reflect the filtered subset." height={300} />
      <Heading level={2} id="config">Configuration</Heading>
      <CodeBlock code={`{
  fields: [
    { field: 'amount', agg: 'sum', label: 'Total Revenue' },
    { field: 'amount', agg: 'avg', label: 'Avg Order' },
    { field: 'id', agg: 'count', label: 'Order Count' },
    { field: 'amount', agg: 'max', label: 'Largest Order' },
  ],
  layout: 'grid',  // grid | row | column
}`} language="tsx" />
      <Heading level={2} id="aggregations">Supported Aggregations</Heading>
      <CodeBlock code={`// Built-in aggregations:
// sum, avg, count, min, max, count_distinct,
// median, first, last, any, mode, stddev, variance, string_agg

// Custom aggregations via registerAgg():
import { registerAgg } from '@unify/table-core';
registerAgg('p95', (field) => \`PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY \${field})\`);`} language="tsx" />
      <PageNav />
    </div>
  );
}
