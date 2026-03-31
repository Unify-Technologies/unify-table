import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { Example } from "../../components/Example";
import { CodeBlock } from "../../components/CodeBlock";
import { PageNav } from "../../components/PageNav";

export default function PivotDisplay() {
  return (
    <div>
      <PageTitle>Pivot Display</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Cross-tabulation matrix with GROUP BY and client-side pivoting. Supports row and column totals.
      </p>
      <p className="text-[13px] mb-6" style={{ color: "var(--doc-text-secondary)" }}>
        The pivot display creates a cross-tabulation matrix from your data. Rows become one dimension,
        columns become another, and cells show aggregated values. It is the SQL <code>GROUP BY</code> equivalent
        of a spreadsheet pivot table — the grouping and aggregation happen in DuckDB, then the result is
        pivoted client-side into a matrix layout with optional row and column totals.
      </p>
      <Heading level={2} id="example">Pivot Table</Heading>
      <Example id="display-pivot" title="Ticker x Region" description="Read across a row to see one ticker's PnL by region. Read down a column to compare tickers within a region." height={400} />
      <Heading level={2} id="config">Configuration</Heading>
      <CodeBlock code={`{
  rowField: 'region',       // Row grouping field
  colField: 'category',     // Column grouping field
  valueField: 'amount',     // Value to aggregate
  agg: 'sum',               // Aggregation function
  showRowTotals: true,      // Show total column on the right
  showColTotals: true,      // Show total row at the bottom
}`} language="tsx" />
      <Heading level={2} id="styling">Styling</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Pivot tables use <code>utbl-pivot-*</code> CSS classes for styling. Override them to customize appearance.
      </p>
      <CodeBlock code={`.utbl-pivot-cell { padding: 4px 8px; text-align: right; }
.utbl-pivot-header { font-weight: 600; }
.utbl-pivot-total { background: var(--pivot-total-bg); }`} language="css" />
      <PageNav />
    </div>
  );
}
