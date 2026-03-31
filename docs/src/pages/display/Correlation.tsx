import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { Example } from "../../components/Example";
import { CodeBlock } from "../../components/CodeBlock";
import { PageNav } from "../../components/PageNav";

export default function CorrelationDisplay() {
  return (
    <div>
      <PageTitle>Correlation Display</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Pairwise Pearson correlation heatmap for numeric columns using DuckDB <code>CORR()</code>.
      </p>
      <p className="text-[13px] mb-6" style={{ color: "var(--doc-text-secondary)" }}>
        The correlation display computes pairwise Pearson correlation coefficients between all numeric columns,
        rendered as an ECharts heatmap. Use it to quickly identify relationships between variables — for example,
        whether discount percentage correlates with order value, or if two metrics move together.
      </p>
      <Heading level={2} id="example">Correlation Matrix</Heading>
      <Example id="display-correlation" title="Trade Correlations" description="Bright cells indicate strong correlations between PnL, volume, and notional. Filter the data and watch correlations shift." height={400} />
      <Heading level={2} id="how-it-works">How It Works</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The display automatically detects numeric columns, computes pairwise <code>CORR()</code> values via SQL, and renders an ECharts heatmap. Index-based aliases (<code>p_i_j</code>) keep the SQL compact for large column sets.
      </p>
      <Heading level={2} id="config">Configuration</Heading>
      <CodeBlock code={`{
  // Correlation display auto-detects numeric columns.
  // Identity columns (id, *_id) are excluded by default.
  columns: ['price', 'quantity', 'discount', 'total'],  // Optional: explicit column list
}`} language="tsx" />
      <Heading level={2} id="interpretation">Interpreting Results</Heading>
      <CodeBlock code={`// Correlation values range from -1 to 1:
//  1.0  = perfect positive correlation
//  0.0  = no linear correlation
// -1.0  = perfect negative correlation
//
// Color scale: red (negative) -> white (zero) -> blue (positive)`} language="tsx" />
      <PageNav />
    </div>
  );
}
