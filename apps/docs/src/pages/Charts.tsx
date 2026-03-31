import { PageTitle } from "../components/PageTitle";
import { Heading } from "../components/Heading";
import { CodeBlock } from "../components/CodeBlock";
import { Example } from "../components/Example";
import { Callout } from "../components/Callout";
import { PageNav } from "../components/PageNav";

export default function Charts() {
  return (
    <div>
      <PageTitle>Charts</PageTitle>
      <p className="text-[15px] mb-4" style={{ color: "var(--doc-text-secondary)" }}>
        ECharts wrapper and SQL chart builders from <code>@unify/table-charts</code>.
      </p>
      <p className="text-[13px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        The charts package wraps Apache ECharts with SQL-driven data builders. Query the same <code>trades_sample</code> data as the table examples, then pass the results through an option builder to get a complete ECharts config.
      </p>

      <Example
        id="with-charts"
        title="Standalone Charts"
        description="Toggle between a bar chart (PnL by ticker) and a pie chart (trade count). Both query trades_sample via DuckDB and render with EChartsWrapper."
        height={420}
      />

      <Heading level={2} id="chart-types">Available Chart Types</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Each chart type has a dedicated option builder and, where applicable, a SQL builder that generates the aggregation query.
      </p>
      <div className="text-[13px] mb-6 space-y-1" style={{ color: "var(--doc-text-secondary)" }}>
        <p><strong>Bar / Line / Area</strong> — categorical or time-series data with optional stacking. SQL builder: <code>barLineSql</code>.</p>
        <p><strong>Pie / Donut</strong> — proportional data with optional series for nested rings. SQL builder: <code>pieSql</code>.</p>
        <p><strong>Scatter</strong> — two numeric axes for correlation analysis. SQL builder: <code>scatterSql</code>.</p>
        <p><strong>Histogram</strong> — distribution of a single numeric column with configurable bin count. SQL builder: <code>histogramSql</code>.</p>
        <p><strong>Heatmap</strong> — two-dimensional density using color intensity. SQL builder: <code>heatmapSql</code>.</p>
        <p><strong>Treemap</strong> — hierarchical proportional areas. Config-only (no dedicated SQL builder).</p>
        <p><strong>Funnel</strong> — sequential stage drop-off. Config-only (no dedicated SQL builder).</p>
      </div>

      <Heading level={2} id="option-builders">Option Builders</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Option builders transform query results into ECharts option objects. Pass the data rows and a chart config, and get back a complete option ready to render.
      </p>
      <CodeBlock code={`import { buildBarLineOption, buildPieOption, buildScatterOption,
         buildHistogramOption, buildHeatmapOption, buildTreemapOption,
         buildFunnelOption, DARK_CHART_THEME } from '@unify/table-charts';

// Query data from DuckDB
const data = await db.runAndRead(
  'SELECT ticker, SUM(pnl) AS total_pnl FROM trades GROUP BY ticker'
);

// Build the ECharts option
const option = buildBarLineOption(data, {
  type: 'bar',
  x: 'ticker',
  y: { field: 'total_pnl', agg: 'sum' },
  theme: DARK_CHART_THEME,
});`} language="tsx" />

      <Heading level={2} id="echarts-wrapper">EChartsWrapper</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        A thin React component that manages the ECharts instance lifecycle — initialization, resizing, theme changes, and disposal. Pass any ECharts option object.
      </p>
      <CodeBlock code={`import { EChartsWrapper } from '@unify/table-charts';

<EChartsWrapper option={option} style={{ width: '100%', height: 400 }} />`} language="tsx" />

      <Heading level={2} id="sparkline">Sparkline</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        A minimal inline chart for embedding in table cells, cards, or tight layouts. Renders a tiny line or bar chart with no axes, labels, or interactivity.
      </p>
      <CodeBlock code={`import { Sparkline } from '@unify/table-charts';

<Sparkline data={[10, 20, 15, 30, 25]} type="line" width={80} height={24} />`} language="tsx" />

      <Callout type="tip" title="Standalone vs Display System">
        For quick one-off charts, use <code>EChartsWrapper</code> directly with an option builder. For charts that live alongside your table data and respond to the table's filters and grouping, use the "chart" display type — it handles SQL generation, data fetching, and a configuration UI automatically.
      </Callout>

      <PageNav />
    </div>
  );
}
