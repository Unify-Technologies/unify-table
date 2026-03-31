import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { Example } from "../../components/Example";
import { CodeBlock } from "../../components/CodeBlock";
import { PageNav } from "../../components/PageNav";

export default function OutliersDisplay() {
  return (
    <div>
      <PageTitle>Outliers Display</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        IQR and z-score outlier detection with inline SVG box plot and outlier data table.
      </p>
      <p className="text-[13px] mb-6" style={{ color: "var(--doc-text-secondary)" }}>
        The outliers display detects statistical outliers using either IQR (Interquartile Range) or z-score
        methods. Results are shown as an inline SVG box plot alongside a table of outlier records. This is
        useful for data quality checks — quickly surface unusually large orders, price spikes, or any
        values that fall outside the expected range.
      </p>
      <Heading level={2} id="example">Outlier Detection</Heading>
      <Example id="display-outliers" title="Notional Outliers" description="Trades with unusually high notional values, labeled by ticker. Filter by desk to see which has the most anomalous trades." height={400} />
      <Heading level={2} id="config">Configuration</Heading>
      <CodeBlock code={`{
  field: 'amount',          // Numeric field to analyze
  method: 'iqr',            // iqr | zscore
  threshold: 1.5,           // IQR multiplier (default 1.5) or z-score cutoff (default 3)
}`} language="tsx" />
      <Heading level={2} id="iqr">IQR Method</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The interquartile range method flags values below <code>Q1 - 1.5 * IQR</code> or above <code>Q3 + 1.5 * IQR</code>.
        A CTE computes quartile stats, then a sentinel <code>UNION ALL</code> row (wrapped in a subquery) carries the box plot statistics.
      </p>
      <Heading level={2} id="zscore">Z-Score Method</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The z-score method flags values where <code>|value - mean| / stddev &gt; threshold</code>. Default threshold is 3 standard deviations.
      </p>
      <CodeBlock code={`-- Generated SQL for IQR detection:
WITH stats AS (
  SELECT PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY "amount") AS q1,
         PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY "amount") AS q3
  FROM "orders"
),
bounds AS (
  SELECT q1, q3, (q3 - q1) AS iqr,
         q1 - 1.5 * (q3 - q1) AS lower,
         q3 + 1.5 * (q3 - q1) AS upper
  FROM stats
)
SELECT * FROM "orders"
WHERE "amount" < (SELECT lower FROM bounds)
   OR "amount" > (SELECT upper FROM bounds)`} language="sql" />
      <PageNav />
    </div>
  );
}
