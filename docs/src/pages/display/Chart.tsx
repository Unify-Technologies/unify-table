import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { Example } from "../../components/Example";
import { CodeBlock } from "../../components/CodeBlock";
import { Callout } from "../../components/Callout";
import { PageNav } from "../../components/PageNav";

export default function ChartDisplay() {
  return (
    <div>
      <PageTitle>Chart Display</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        10 chart types: bar, line, area, pie, donut, scatter, histogram, heatmap, treemap, funnel.
      </p>

      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The chart display renders your table data as interactive ECharts visualizations. It supports bar, line,
        area, pie, donut, scatter, histogram, heatmap, treemap, and funnel charts — all driven by SQL
        aggregation queries that DuckDB executes before the data reaches the browser.
      </p>

      <Callout type="info">See charts in action in the <a href="#/demo" style={{color: "var(--doc-accent)"}}>Interactive Demo</a> — the Volume Chart and PnL Chart panels use bar and line displays.</Callout>

      <Heading level={2} id="chart-type-guide">Chart Type Guide</Heading>
      <ul className="text-[13px] mb-4 space-y-1.5 list-disc list-inside" style={{ color: "var(--doc-text-secondary)" }}>
        <li><strong>Bar</strong> — compare discrete categories (revenue by region, counts by status)</li>
        <li><strong>Line</strong> — show trends over an ordered axis (daily sales, monthly growth)</li>
        <li><strong>Area</strong> — like line, but emphasizes volume (cumulative totals, stacked contributions)</li>
        <li><strong>Pie / Donut</strong> — show proportions of a whole (market share, category breakdown)</li>
        <li><strong>Scatter</strong> — reveal relationships between two numeric variables (price vs. quantity)</li>
        <li><strong>Histogram</strong> — visualize the distribution of a single numeric column (order amounts)</li>
        <li><strong>Heatmap</strong> — show density or intensity across two dimensions (hour vs. day activity)</li>
        <li><strong>Treemap</strong> — display hierarchical proportions (nested category breakdowns)</li>
        <li><strong>Funnel</strong> — show sequential drop-off stages (conversion pipeline, process stages)</li>
      </ul>

      <Heading level={2} id="bar-chart">Bar Chart</Heading>
      <Example id="display-chart" title="PnL by Ticker" description="Which tickers are profitable? Toggle between chart and table view. Filter by region — the chart updates automatically." height={400} />

      <Heading level={2} id="config">Configuration</Heading>
      <CodeBlock code={`{
  type: 'bar',       // bar | line | area | pie | donut | scatter | histogram | heatmap | treemap | funnel
  x: 'category',    // X-axis field
  y: { field: 'amount', agg: 'sum' },  // Y-axis: field + aggregation
  series: 'region',  // Optional: group by color
  sort: 'value',     // Sort by value or name
  horizontal: false, // Horizontal bars
  stacked: false,    // Stack series
  limit: 5000,       // Max data points
}`} language="tsx" />

      <Callout type="info" title="Performance limit">
        Charts default to a <code>LIMIT 5000</code> on the aggregation query to keep rendering fast.
        You can increase this value in the config, but large point counts may cause browser lag with
        interactive features like tooltips and zoom.
      </Callout>
      <PageNav />
    </div>
  );
}
