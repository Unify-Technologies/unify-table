import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { Example } from "../../components/Example";
import { CodeBlock } from "../../components/CodeBlock";
import { Callout } from "../../components/Callout";
import { PageNav } from "../../components/PageNav";

export default function TimelineDisplay() {
  return (
    <div>
      <PageTitle>Timeline Display</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Time-bucketed chart using <code>date_trunc</code>. Reuses <code>buildBarLineOption</code> from the charts package.
      </p>
      <p className="text-[13px] mb-6" style={{ color: "var(--doc-text-secondary)" }}>
        The timeline display buckets your data by time intervals (day, week, month, quarter, year) and renders
        a time-series chart. Ideal for understanding how metrics evolve over time — pick a date column,
        choose a bucket size, and the display generates a <code>date_trunc</code>-based SQL query that groups
        and aggregates your data into uniform time periods.
      </p>

      <Callout type="info">See the timeline in action in the <a href="#/demo" style={{color: "var(--doc-accent)"}}>Interactive Demo</a> — the "PnL Timeline" panel shows trade PnL over time.</Callout>

      <Heading level={2} id="example">Time Series</Heading>
      <Example id="display-timeline" title="PnL Over Time" description="Each colored area represents a desk. Filter by ticker to see that stock's PnL trend across desks." height={400} />
      <Heading level={2} id="config">Configuration</Heading>
      <CodeBlock code={`{
  dateField: 'created_at',      // Date/timestamp column
  bucket: 'month',              // year | quarter | month | week | day | hour
  valueField: 'amount',         // Value to aggregate
  agg: 'sum',                   // Aggregation function
  chartType: 'bar',             // bar | line | area
}`} language="tsx" />
      <Heading level={2} id="bucketing">Date Bucketing</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The SQL builder uses DuckDB's <code>date_trunc</code> function to bucket timestamps into uniform intervals. This ensures consistent spacing even when data has gaps.
      </p>
      <CodeBlock code={`-- Generated SQL for monthly bucketing:
SELECT date_trunc('month', "created_at") AS bucket,
       SUM("amount") AS value
FROM "orders"
GROUP BY bucket
ORDER BY bucket`} language="sql" />
      <PageNav />
    </div>
  );
}
