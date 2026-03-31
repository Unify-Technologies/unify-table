import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { CodeBlock } from "../../components/CodeBlock";
import { Example } from "../../components/Example";
import { Callout } from "../../components/Callout";
import { PageNav } from "../../components/PageNav";

export default function TableIOPlugin() {
  return (
    <div>
      <PageTitle>Table I/O</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Import and export table data in CSV, JSON, and Parquet formats with progress events.
      </p>

      <Example
        id="with-table-io"
        title="Import & Export"
        description="Open the Export panel (arrow icon in the toolbar) to download the table as CSV, JSON, or Parquet. You can also select a range of cells and export just the selection."
        height={420}
      />

      <Heading level={2} id="usage">Usage</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Add the <code>tableIO()</code> plugin to enable the Export panel and programmatic import/export.
      </p>
      <CodeBlock code={`import { Table, tableIO, filters, selection } from '@unify/table-react';

<Table
  db={db}
  table="trades"
  plugins={[tableIO(), filters(), selection("range")]}
/>`} language="tsx" />

      <Heading level={2} id="export">Export</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Export the full table or a filtered subset. Three formats are supported — CSV and JSON are generated client-side, while Parquet uses DuckDB's native writer for maximum performance.
      </p>
      <CodeBlock code={`// Export as CSV
await ctx.tableIO.export('csv');

// Export as Parquet blob
const blob = await ctx.tableIO.export('parquet');

// Export as JSON
await ctx.tableIO.export('json');`} language="tsx" />

      <Heading level={2} id="import">Import</Heading>
      <CodeBlock code={`// Import from a File object
await ctx.tableIO.import(file);`} language="tsx" />

      <Heading level={2} id="progress">Progress Events</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Large imports and exports emit progress events so you can display a progress
        bar or status indicator.
      </p>
      <Callout type="tip" title="Parquet for Large Datasets">
        For tables with 100K+ rows, use Parquet export — it's significantly faster and produces smaller files than CSV or JSON. DuckDB handles the serialization natively in WebAssembly.
      </Callout>
      <PageNav />
    </div>
  );
}
