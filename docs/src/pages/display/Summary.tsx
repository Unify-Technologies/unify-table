import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { Example } from "../../components/Example";
import { CodeBlock } from "../../components/CodeBlock";
import { PageNav } from "../../components/PageNav";

export default function SummaryDisplay() {
  return (
    <div>
      <PageTitle>Summary Display</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Auto-profile every column via DuckDB <code>SUMMARIZE</code>. Lazy-loaded histograms per card.
      </p>
      <p className="text-[13px] mb-6" style={{ color: "var(--doc-text-secondary)" }}>
        The summary display auto-profiles every column in your table using DuckDB's <code>SUMMARIZE</code> command.
        Each column gets a card showing distribution, null rate, unique count, and a lazy-loaded histogram.
        This is the fastest way to understand a new dataset — no configuration required.
      </p>
      <Heading level={2} id="example">Column Profiles</Heading>
      <Example id="display-summary" title="Trade Data Profile" description="Every column gets an automatic statistical profile. Numeric columns show histograms. Zero configuration required." height={400} />
      <Heading level={2} id="how-it-works">How It Works</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The summary display runs DuckDB's built-in <code>SUMMARIZE</code> statement to compute per-column statistics including min, max, unique count, null count, and approximate quantiles. Each column card lazily loads a histogram when scrolled into view.
      </p>
      <Heading level={2} id="config">Configuration</Heading>
      <CodeBlock code={`{
  // Summary display uses auto-detection, minimal config needed.
  // Identity columns (id, *_id) are excluded by default.
  excludeColumns: ['internal_notes'],  // Additional columns to exclude
}`} language="tsx" />
      <Heading level={2} id="output">Output Per Column</Heading>
      <CodeBlock code={`// Each column card shows:
// - Column name and type
// - Min / Max values
// - Unique count
// - Null count and percentage
// - Approximate quartiles (numeric columns)
// - Histogram (lazy-loaded on scroll)`} language="tsx" />
      <PageNav />
    </div>
  );
}
