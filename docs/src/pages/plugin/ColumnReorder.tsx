import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { Example } from "../../components/Example";
import { CodeBlock } from "../../components/CodeBlock";
import { PageNav } from "../../components/PageNav";

export default function ColumnReorderPlugin() {
  return (
    <div>
      <PageTitle>Column Reorder</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Drag-and-drop column headers to reorder columns using the HTML5 Drag and Drop API.
      </p>

      <Heading level={2} id="usage">Usage</Heading>
      <CodeBlock code={`import { Table, columnReorder } from '@unify/table-react';

<Table db={db} table="employees" plugins={[columnReorder()]} />`} language="tsx" />

      <Heading level={2} id="example">Example</Heading>
      <Example id="with-column-reorder" description="Drag any column header to reorder. Drop it between other columns to rearrange your view." height={350} />

      <Heading level={2} id="behavior">Behavior</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Click and drag any column header to move it. A visual indicator shows the drop
        position. The new column order is persisted in the table state and reflected
        immediately. Works alongside column pinning -- pinned columns maintain their
        pinned position.
      </p>
      <PageNav />
    </div>
  );
}
