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
        Export the full table or just the selection. CSV, JSON, Parquet, and XLSX formats are
        supported. Parquet uses DuckDB's native writer for maximum performance on large datasets.
      </p>
      <CodeBlock code={`import { tableIO } from '@unify/table-react';

const io = tableIO();
// After mounting, get the handle from the plugin:
const handle = io.getHandle(ctx);

await handle.exportCSV();                          // full table
await handle.exportCSV({ selection: true });       // selected cells only
await handle.exportJSON({ pretty: true });
await handle.exportParquet({ filename: 'data.parquet' });
await handle.exportXLSX({ sheet: 'Q1 Report' });`} language="tsx" />

      <Heading level={2} id="import">Import</Heading>
      <CodeBlock code={`// Import from a File object (CSV, JSON, or Parquet)
await handle.importFile(file);

// Append to existing table instead of replacing
await handle.importFile(file, { append: true });`} language="tsx" />

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
