import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { Example } from "../../components/Example";
import { CodeBlock } from "../../components/CodeBlock";
import { PageNav } from "../../components/PageNav";

export default function ColumnResizePlugin() {
  return (
    <div>
      <PageTitle>Column Resize</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Drag column borders to resize. Double-click to auto-fit column width to content.
      </p>

      <Heading level={2} id="usage">Usage</Heading>
      <CodeBlock code={`import { Table, columnResize } from '@unify/table-react';

<Table db={db} table="products" plugins={[columnResize()]} />`} language="tsx" />

      <Heading level={2} id="example">Example</Heading>
      <Example id="with-column-resize" description="Drag the border between column headers to resize. Double-click a border to auto-fit the column width." height={350} />

      <Heading level={2} id="behavior">Behavior</Heading>
      <div className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Drag</strong> — a handle appears on the right edge of each column header. Drag to resize in real time.</li>
          <li><strong>Double-click</strong> — auto-sizes the column to fit its widest visible content.</li>
          <li><strong>Persist</strong> — use <code>initialColumnWidths</code> and <code>onColumnWidthsChange</code> to save/restore widths.</li>
        </ul>
      </div>

      <Heading level={2} id="persisting">Persisting Widths</Heading>
      <CodeBlock code={`// Save and restore column widths
<Table
  db={db}
  table="products"
  plugins={[columnResize()]}
  initialColumnWidths={{ name: 200, price: 120 }}
  onColumnWidthsChange={(widths) => save(widths)}
/>`} language="tsx" />
      <PageNav />
    </div>
  );
}
